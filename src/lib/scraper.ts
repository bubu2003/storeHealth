import * as cheerio from 'cheerio';

export interface ScrapedData {
  url: string;
  title: string;
  metaDescription: string;
  headings: {
    h1: string[];
    h2: string[];
  };
  images: {
    total: number;
    withAlt: number;
    withoutAlt: number;
  };
  details: {
    platform: string;
    hasSchema: boolean;
    canonicalUrl?: string;
    ogTags: Record<string, string>;
  };
  htmlSnippet: string; // Truncated HTML for AI context
  topImages: string[]; // URLs of primary images for vision analysis
  products?: Array<{
    name: string;
    description: string;
    price?: number;
    image?: string;
  }>;
  categories?: string[];
  banners?: Array<{
    text: string;
    alt?: string;
  }>;
}

export async function scrapeUrl(url: string): Promise<ScrapedData> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Extract metadata
  const title = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
  const metaDescription = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';

  // Extract headings
  let h1 = $('h1').map((_, el) => $(el).text().trim()).get();
  let h2 = $('h2').map((_, el) => $(el).text().trim()).get();

  // Fallback for non-semantic sites (like the user's specific store)
  if (h1.length === 0) {
    h1 = $('div[class*="title"], span[class*="title"], div[class*="header"], .hero-text, .product-name')
      .slice(0, 3)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 5);
  }
  
  if (h2.length === 0) {
    h2 = $('div[class*="subtitle"], .section-title, h3')
      .slice(0, 5)
      .map((_, el) => $(el).text().trim())
      .get()
      .filter(text => text.length > 5);
  }

  // Analyze images
  const images = $('img').get();
  const totalImages = images.length;
  const withAlt = images.filter(img => $(img).attr('alt')?.trim()).length;

  // Platform detection
  let platform = 'Unknown';
  if (html.includes('cdn.shopify.com') || html.includes('Shopify.shop')) platform = 'Shopify';
  else if (html.includes('wp-content') || html.includes('WordPress')) platform = 'WordPress/WooCommerce';
  else if (html.includes('Magento')) platform = 'Magento';
  // Determine if it is MyKart (Specific check for the user's platform)
  if (html.includes('mykart') || html.includes('buildmystore.io') || html.includes('mykartppe')) {
    platform = 'MyKart';
  }

  // OG tags
  const ogTags: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property')?.replace('og:', '') || '';
    const content = $(el).attr('content') || '';
    if (prop) ogTags[prop] = content;
  });

  // Schema detection
  const hasSchema = $('script[type="application/ld+json"]').length > 0;

  // Next.js / MyKart Data Extraction
  const products: Array<{ name: string; description: string }> = [];
  const categories: string[] = [];
  
  $('script').each((_, el) => {
    const content = $(el).html() || '';
    if (content.includes('products') || content.includes('categories')) {
      // Try to find JSON-like structures that contain product data
      try {
        // Look for the products array in the Next.js RSC payload or __NEXT_DATA__
        // Improved regex to find names and descriptions independently in the script content
        const nameRegex = /"name":"([^"]+)"/g;
        let match;
        while ((match = nameRegex.exec(content)) !== null) {
          const name = match[1];
          // Filter out common UI strings that might match the pattern
          if (name.length > 3 && !['Street Merch Co.', 'Men', 'Women', 'Accessories', 'Categories', 'Wishlist', 'Support', 'Home', 'Cart', 'Account'].includes(name)) {
            // Try to find a description nearby (within 500 characters)
            const subContent = content.substring(match.index, match.index + 500);
            const descMatch = subContent.match(/"description":"([^"]+)"/);
            
            if (!products.find(p => p.name === name)) {
              products.push({
                name: name,
                description: descMatch ? descMatch[1].replace(/\\u[0-9a-fA-F]{4}/g, '').replace(/<[^>]*>?/gm, '') : ''
              });
            }
          }
        }

        // Category names
        const categoryMatches = content.match(/"name":"([^"]+)","description":/g);
        if (categoryMatches) {
          categoryMatches.forEach(m => {
            const nameMatch = m.match(/"name":"([^"]+)"/);
            if (nameMatch && !['Men', 'Women', 'Accessories'].includes(nameMatch[1])) { // Avoid duplicates if possible
               if (!categories.includes(nameMatch[1])) categories.push(nameMatch[1]);
            }
          });
        }
      } catch {
        // Ignore parsing errors for individual script tags
      }
    }
  });

  // Fallback product extraction for MyKart / Next.js stores
  if (products.length === 0) {
    $('a[href*="/product/"]').each((_, el) => {
      let name = $(el).text().trim();
      // Clean name: remove price (₹), currency (RS), and trail numbers
      name = name.split('₹')[0].split('RS')[0].trim();
      name = name.replace(/\d+$/, '').trim();
      
      if (name && name.length > 2 && !products.find(p => p.name === name)) {
        products.push({
          name: name,
          description: ''
        });
      }
    });
  }

  // Fallback category extraction from DOM
  if (categories.length === 0) {
    $('a[href*="/category/"]').each((_, el) => {
      const text = $(el).text().trim();
      if (text && text.length > 2 && !categories.includes(text)) {
        categories.push(text);
      }
    });
  }

  // Banner Extraction
  const banners: Array<{ text: string; alt?: string }> = [];
  $('section[class*="hero"], div[class*="hero"], div[class*="banner"], .carousel-item').each((_, el) => {
    const text = $(el).find('h1, h2, h3, p, span').map((_, e) => $(e).text().trim()).get().join(' ');
    const alt = $(el).find('img').attr('alt');
    if (text.length > 5 || alt) {
      banners.push({ text: text.substring(0, 200), alt });
    }
  });

  // Return data
  return {
    url,
    title,
    metaDescription,
    headings: { h1, h2 },
    images: {
      total: totalImages,
      withAlt,
      withoutAlt: totalImages - withAlt,
    },
    details: {
      platform,
      hasSchema,
      canonicalUrl: $('link[rel="canonical"]').attr('href'),
      ogTags,
    },
    htmlSnippet: (
      html.substring(0, 25000) + 
      '\n... [TRUNCATED MIDDLE] ...\n' + 
      html.substring(html.length - 20000)
    ), 
    topImages: [
      $('meta[property="og:image"]').attr('content'),
      ...$('img[class*="product"], img[src*="product"], img[class*="hero"], img[class*="main"], .hero img')
        .map((_, el) => $(el).attr('src') || $(el).attr('data-src'))
        .get(),
      ...$('img')
        .map((_, el) => $(el).attr('src') || $(el).attr('data-src'))
        .get()
    ]
      .filter((src): src is string => !!src)
      .map(src => {
        let finalSrc = src;
        if (finalSrc.startsWith('//')) finalSrc = 'https:' + finalSrc;
        if (finalSrc.startsWith('/') && !finalSrc.startsWith('//')) {
          const baseUrl = new URL(url);
          finalSrc = `${baseUrl.origin}${finalSrc}`;
        }
        return finalSrc;
      })
      .filter((v, i, a) => a.indexOf(v) === i) // Remove duplicates
      .slice(0, 10)
      .filter(src => src.startsWith('http')),
    products: products.length > 0 ? products.slice(0, 30) : undefined,
    categories: categories.length > 0 ? categories : undefined,
    banners: banners.length > 0 ? banners.slice(0, 5) : undefined
  };
}
