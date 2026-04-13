import { NextRequest, NextResponse } from 'next/server';
import { scrapeUrl } from '@/lib/scraper';
import { analyzeStore } from '@/lib/ai-grader';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    console.log(`Forwarding analysis for ${url} to Python Bridge...`);

    // Use environment variable for Bridge URL, or fallback to localhost
    const BRIDGE_URL = (process.env.BRIDGE_URL || 'http://localhost:8000').replace(/\/$/, "");

    // Call the Python Bridge
    const bridgeResponse = await fetch(`${BRIDGE_URL}/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });

    if (!bridgeResponse.ok) {
        const errorData = await bridgeResponse.json();
        throw new Error(errorData.detail || 'Python Bridge failed to analyze store');
    }

    const { analysis, metadata } = await bridgeResponse.json();

    // Return results in the format the UI expects
    return NextResponse.json({
      metadata: {
        url: url,
        platform: metadata?.platform || 'BuildMyStore',
        title: metadata?.title || 'Your Store',
      },
      analysis, // This is the actual audit object from Gemini
    });
  } catch (error) {
    console.error('API Error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred during analysis.';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
