import { GoogleGenerativeAI } from '@google/generative-ai';
import { ScrapedData } from './scraper';


export interface AnalysisResult {
  score: number;
  categories: {
    seo: number;
    content: number;
    conversion: number;
    technical: number;
    ux: number;
  };
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    impact: 'High' | 'Medium' | 'Low';
    effort: 'Quick Win' | 'Moderate' | 'Major Project';
    category: string;
    currentValue: string;
    suggestedValue: string;
    whyItMatters: string;
  }>;
  summary: string;
  sellerInsights: {
    trustScore: number;
    marketPositioning: string;
    growthPotential: 'High' | 'Medium' | 'Low';
    conversionFriction: 'High' | 'Medium' | 'Low';
  };
  visualAnalysis: {
    bannerClarity: string;
    couponDetected: boolean;
    couponFeedback?: string;
    visualTone: string;
  };
  growthScopes: {
    title: string;
    score: number;
    description: string;
    priority: 'Immediate' | 'Mid-term' | 'Long-term';
  }[];
  specificProductFixes?: Array<{
    originalName: string;
    optimizedName: string;
    reason: string;
    details?: {
      materials?: string;
      style?: string;
      seoKeywords: string[];
    };
  }>;
  screenshot?: string;
}

export async function analyzeStore(data: ScrapedData): Promise<AnalysisResult> {
  // Check for API key at call time to support environment variable updates
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const mock = getMockAnalysis(data);
    mock.summary = "API Key Missing. Please ensure GEMINI_API_KEY is set in your .env.local file. Make sure to restart the server (npm run dev) after saving the file.";
    return mock;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-2.0-flash-001',
    'gemini-1.5-flash'
  ];

  const sanitizedHtml = data.htmlSnippet
    .replace(/<script\b[\s\S]*?<\/script>/gi, '[script removed]')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '[style removed]')
    .replace(/\s\s+/g, ' ')
    .trim();

  // Prepare a specialized prompt for BuildMyStore / MyKart
  const prompt = `
    You are an expert E-commerce Growth Auditor specializing in the BuildMyStore (MyKart) platform.
    Analyze the provided store data and generate a high-fidelity audit.
    
    STORE DATA:
    - URL: ${data.url}
    - Platform: ${data.details.platform}
    - Title: "${data.title}"
    - Meta Description: "${data.metaDescription}"
    - Headings: ${JSON.stringify(data.headings)}
    - Images: ${data.images.total} total, ${data.images.withAlt} with alt text, ${data.images.withoutAlt} missing alt text.
    - Schema Markup: ${data.details.hasSchema ? 'Found' : 'Missing'}
    - OG Tags: ${JSON.stringify(data.details.ogTags)}
    
    STRUCTURED CONTENT:
    - Products Found: ${data.products ? JSON.stringify(data.products) : 'None discovered (check HTML)'}
    - Product Categories: ${data.categories ? JSON.stringify(data.categories) : 'None discovered'}
    - Banners Discovery: ${data.banners ? JSON.stringify(data.banners) : 'No explicit banners found'}
    
    HTML CONTEXT (Sanitized):
    ${sanitizedHtml}
    
    DETAILED REQUIREMENTS:
    1. Calculate scores (0-100) for SEO, Content, Conversion, Technical, and UX using this STRICT rubric:
       SCORING RUBRIC (follow exactly):
       - SEO: +20 if title tag exists, +15 if meta description exists, +15 if h1 exists, +15 if images have alt text, +10 if schema markup found, +10 if OG tags found, +15 if product names are descriptive.
       - Content: +20 if 5+ products listed, +20 if product descriptions exist, +20 if categories are organized, +20 if banners have text, +20 if no typos found.
       - Conversion: +25 if CTA buttons visible, +25 if coupons/offers detected, +25 if trust signals exist (reviews, ratings), +25 if clear pricing shown.
       - Technical: +25 if page loads (it did), +25 if canonical URL exists, +25 if schema markup found, +25 if mobile-friendly structure.
       - UX: +20 if navigation is clear, +20 if images load properly, +20 if categories accessible, +20 if search available, +20 if banner is visually clear.
       The overall score = weighted average: SEO(25%) + Content(20%) + Conversion(25%) + Technical(15%) + UX(15%).
    2. PLATFORM SPECIFIC RULES (BuildMyStore/MyKart):
       - SUPPORTED CATEGORIES: [Stationery & Books, Restaurant / Eatery, Meat, Poultry & Seafood, Agri-Tech & Farm Equipment, Electronics & Gadgets, Animal Feed & Supplements, Grocery & Provisions, Pet Food & Supplies, Bakery & Cakes, Apparel & Clothing, Sweets & Confectionery, Home Decor & Furnishings, Fruits & Vegetables, Beauty & Cosmetics, Pharmacy / Medical Store, Dairy & Milk Products, Cloud Kitchen, Fashion Accessories].
       - DO NOT suggest changes to theme colors, button styles, or layout structure (these are automated).
       - DO PRIORITIZE tailored growth roadmaps for the detected category.
       - ONE-BY-ONE PRODUCT ANALYSIS: Iterate through every name in "Products Found". provide a 'specificProductFixes' entry for EVERY product that has a generic or non-SEO name.
       - Fixing typos (e.g., "Hoddie" to "Hoodie") is a top priority.
    3. Generate 10-14 highly specific "Seller-Friendly" recommendations. 
       - Avoid technical talk. Tell them EXACTLY what to change in their dashboard.
    4. Provide a "specificProductFixes" list iterating through the products found. For each item, provide a better optimized name and a specific breakdown of why (e.g. materials, style, target keywords).
    5. Provide a "Seller Insights" object as defined below.
    6. Analyze the attached images for visual clarity and coupon visibility.

    JSON RESPONSE FORMAT:
    {
      "score": number,
      "categories": { "seo": number, "content": number, "conversion": number, "technical": number, "ux": number },
      "recommendations": [
        {
          "id": "string", "title": "string", "description": "string", "impact": "High" | "Medium" | "Low", "effort": "Quick Win" | "Moderate" | "Major Project", "category": "string", "currentValue": "string", "suggestedValue": "string", "whyItMatters": "string"
        }
      ],
      "specificProductFixes": [
        { 
          "originalName": "string", 
          "optimizedName": "string", 
          "reason": "string",
          "details": {
            "materials": "string",
            "style": "string",
            "seoKeywords": ["string", "string"]
          }
        }
      ],
      "summary": "string",
      "sellerInsights": { "trustScore": number, "marketPositioning": "string", "growthPotential": "High" | "Medium" | "Low", "conversionFriction": "High" | "Medium" | "Low" },
      "visualAnalysis": { "bannerClarity": "string", "couponDetected": boolean, "couponFeedback": "string", "visualTone": "string" },
      "growthScopes": [
        { "title": "string", "score": number, "description": "string", "priority": "Immediate" | "Mid-term" | "Long-term" }
      ]
    }
  `;

  try {
    const imagesToProcess = data.topImages.slice(0, 3);
    const SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

    const imageParts = await Promise.all(
      imagesToProcess.map(async (url) => {
        try {
          const res = await fetch(url);
          if (!res.ok) return null;
          
          const contentType = res.headers.get('content-type') || 'image/jpeg';
          if (!SUPPORTED_MIME_TYPES.includes(contentType)) {
            console.warn(`Skipping unsupported image format: ${contentType} for ${url}`);
            return null;
          }

          const buffer = await res.arrayBuffer();
          // Skip very small files (less than 2KB) which are usually small icons/logos
          if (buffer.byteLength < 2000) {
            console.warn(`Skipping small icon/logo: ${url}`);
            return null;
          }

          return {
            inlineData: {
              data: Buffer.from(buffer).toString('base64'),
              mimeType: contentType
            }
          };
        } catch (err) {
          console.warn(`Failed to process image ${url}:`, err);
          return null;
        }
      })
    );

    const validImageParts = imageParts.filter((p): p is { inlineData: { data: string; mimeType: string } } => p !== null);
    
    let text = "";
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            const model = genAI.getGenerativeModel({ 
              model: modelName,
              generationConfig: { 
                responseMimeType: "application/json",
                temperature: 0
              }
            });

            // Convert validImageParts from fetch format to library format
            const libraryImageParts = validImageParts.map(part => ({
              inlineData: part.inlineData
            }));

            const result = await model.generateContent([prompt, ...libraryImageParts]);
            text = result.response.text();
            
            if (text) break;
        } catch (err) {
            lastError = err;
            console.warn(`Model ${modelName} failed:`, err);
        }
    }

    if (!text && lastError) throw lastError;

    try {
      return JSON.parse(text) as AnalysisResult;
    } catch (parseError) {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]) as AnalysisResult;
      throw parseError;
    }
  } catch (error) {
    console.error('AI Grader Critical Failure:', error);
    const mock = getMockAnalysis(data);
    mock.summary = `Audit fallback mode: ${error instanceof Error ? error.message : 'Unknown technical error'}. Please check your configuration.`;
    return mock;
  }
}

function getMockAnalysis(data: ScrapedData): AnalysisResult {
  const products = data.products || [];
  
  return {
    score: 64,
    categories: { 
      seo: 58, 
      content: 65, 
      conversion: 52, 
      technical: 78, 
      ux: 71 
    },
    summary: "Audit falling back to local analysis mode. We've used your store's discovered catalog to generate priority recommendations. Ensure your GEMINI_API_KEY is valid to unlock deep AI analysis.",
    sellerInsights: {
      trustScore: 75,
      marketPositioning: "Emerging brand using BuildMyStore with a clean initial foundation.",
      growthPotential: 'High',
      conversionFriction: 'Medium'
    },
    visualAnalysis: {
      bannerClarity: "Generally good, but needs stronger CTAs.",
      couponDetected: false,
      couponFeedback: "No coupons found in visuals. Consider adding an 'OFFER' banner.",
      visualTone: "Clean, Modern, Urban"
    },
    growthScopes: [
      {
        title: "Catalog Optimization",
        score: 45,
        description: "Your product names are currently generic. Improving these will yield the fastest growth.",
        priority: 'Immediate'
      },
      {
        title: "Trust Signals",
        score: 68,
        description: "Adding secure icons and policy links can reduce customer hesitation.",
        priority: 'Mid-term'
      }
    ],
    recommendations: [
      {
        id: "rec-1",
        title: "Optimize Item Titles for Search",
        description: "Your product titles are currently too short or missing key descriptors. Adding material and style keywords will improve your search visibility by up to 40%.",
        impact: "High",
        effort: "Quick Win",
        category: "SEO",
        currentValue: products.length > 0 ? products[0].name : "Standard titles",
        suggestedValue: products.length > 0 ? `Premium ${products[0].name} - 100% Cotton Urban Edition` : "Material + Style + Product Name",
        whyItMatters: "Better titles rank higher in Google and attract more clicks from shoppers looking for specific quality."
      },
      {
        id: "rec-2",
        title: "Aggressive CTA on Hero Banners",
        description: "Your main banners are informative but lack a clear directive. Adding a discount-driven call-to-action can reduce your homepage bounce rate.",
        impact: "High",
        effort: "Moderate",
        category: "Conversion",
        currentValue: data.banners?.[0]?.text || "Main store banner",
        suggestedValue: "Shop the New Drop — Get 10% Off Your First Order [Shop Now]",
        whyItMatters: "Banners are the first thing customers see. A clear 'Shop Now' button with a hook creates immediate conversion pressure."
      }
    ],
    specificProductFixes: products.length > 0 ? products.map(p => ({
      originalName: p.name,
      optimizedName: `Premium ${p.name} - Best Seller`,
      reason: "Adding descriptive keywords and quality markers increases click-through rates and search visibility.",
      details: {
        materials: "High-Quality Ingredients",
        style: "Professional / Signature",
        seoKeywords: ["Premium", p.name, "Quality", "Authentic"]
      }
    })).slice(0, 15) : [
      {
        originalName: "Generic T-Shirt",
        optimizedName: "Vintage Heavyweight Oversized Graphic Tee",
        reason: "Generic names fail to capture shopper intent. Specifying 'Vintage' and 'Oversized' targets specific niche trends.",
        details: {
          materials: "240 GSM Organic Cotton",
          style: "Oversized / Vintage",
          seoKeywords: ["Oversized Tee", "Graphic T-Shirt", "Heavyweight Cotton"]
        }
      },
      {
        originalName: "Denim Jacket",
        optimizedName: "Rugged Workwear Denim Jacket - Indigo Wash",
        reason: "Adding 'Rugged' and 'Indigo Wash' helps the product stand out in filtered searches for specific colors and styles.",
        details: {
          materials: "Selvedge Denim",
          style: "Workwear / Casual",
          seoKeywords: ["Denim Jacket", "Workwear", "Indigo Jacket"]
        }
      }
    ]
  };
}
