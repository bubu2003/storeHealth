import os
import asyncio
import base64
import json
import re
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from playwright.async_api import async_playwright
import google.generativeai as genai
from PIL import Image
from io import BytesIO
from dotenv import load_dotenv
import traceback

load_dotenv(".env.local")

app = FastAPI(title="Store Health Bridge")

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    print(f"[OK] GEMINI_API_KEY Loaded: {api_key[:5]}...{api_key[-5:]}")
else:
    print("[ERR] ERROR: GEMINI_API_KEY not found in .env.local")

class AnalyzeRequest(BaseModel):
    url: str

@app.get("/")
async def root():
    return {"status": "online", "message": "Store Health Bridge is active"}

async def capture_screenshots(url: str):
    """Captures a full-page screenshot and basic metadata."""
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        try:
            print(f"Browsing to {url}...")
            await page.goto(url, wait_until="networkidle", timeout=60000)
            await asyncio.sleep(3) 
            
            preview_bytes = await page.screenshot(full_page=True, type='jpeg', quality=70)
            title = await page.title()
            
            return {
                "screenshot": preview_bytes, 
                "title": title, 
                "platform": "BuildMyStore"
            }
        except Exception as e:
            error_msg = str(e)
            if "ERR_NAME_NOT_RESOLVED" in error_msg:
                raise HTTPException(
                    status_code=422,
                    detail=f"Store URL unreachable: The domain in '{url}' could not be found. Please check if the URL is correct or if the store is still online."
                )
            elif "ERR_CONNECTION_REFUSED" in error_msg or "ERR_CONNECTION_TIMED_OUT" in error_msg:
                raise HTTPException(
                    status_code=422,
                    detail=f"Store URL unreachable: Could not connect to '{url}'. The store server may be temporarily down."
                )
            elif "Timeout" in error_msg:
                raise HTTPException(
                    status_code=504,
                    detail=f"Store took too long to load. The page at '{url}' did not respond within 60 seconds."
                )
            else:
                raise
        finally:
            await browser.close()

def clean_and_parse_json(text):
    """Aggressively finds and parses the first valid JSON object in a string."""
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()
    start = text.find('{')
    end = text.rfind('}')
    if start == -1 or end == -1 or end < start: return None
    try:
        return json.loads(text[start:end+1])
    except Exception as e:
        print(f"JSON PARSE ERROR: {str(e)}")
        return None

@app.post("/analyze")
async def analyze_store(request: AnalyzeRequest):
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY missing")

    try:
        data = await capture_screenshots(request.url)
        print(f"[SNAP] Captured screenshot: {len(data['screenshot'])} bytes")
        img_str = base64.b64encode(data['screenshot']).decode()
        
        prompt = f"""You are an expert E-commerce Growth Auditor. Analyze this store screenshot from {request.url} and generate a comprehensive audit.

SCORING RUBRIC (follow exactly):
- SEO (0-100): Title tag, meta description, heading structure, image alt text, schema markup, descriptive product names.
- Content (0-100): Number of products, descriptions quality, category organization, banner text, content quality.
- Conversion (0-100): CTA visibility, offers/coupons, trust signals (reviews, ratings), pricing clarity.
- Technical (0-100): Page loads, canonical URL, schema markup, mobile-friendly structure.
- UX (0-100): Navigation clarity, image quality, category access, search availability, visual design.
Overall score = weighted average: SEO(25%) + Content(20%) + Conversion(25%) + Technical(15%) + UX(15%).

REQUIREMENTS:
1. Analyze every visible product and provide SEO-optimized name suggestions.
2. Generate 8-14 specific, actionable recommendations.
3. Identify growth opportunities with clear priorities.
4. Analyze visual elements (banners, layout, trust signals).

Return ONLY valid JSON in this EXACT format:
{{
  "score": number,
  "categories": {{ "seo": number, "content": number, "conversion": number, "technical": number, "ux": number }},
  "summary": "2-3 sentence summary of store health. First sentence should be the store name and key strength.",
  "recommendations": [
    {{
      "id": "rec-1",
      "title": "string",
      "description": "string - seller-friendly explanation",
      "impact": "High" | "Medium" | "Low",
      "effort": "Quick Win" | "Moderate" | "Major Project",
      "category": "SEO" | "Content" | "Conversion" | "Technical" | "UX",
      "currentValue": "what they currently have",
      "suggestedValue": "what they should change to",
      "whyItMatters": "business impact explanation"
    }}
  ],
  "specificProductFixes": [
    {{
      "originalName": "current product name from screenshot",
      "optimizedName": "SEO-optimized product name",
      "reason": "why this change improves discoverability",
      "details": {{
        "materials": "key material or ingredient",
        "style": "target style or category",
        "seoKeywords": ["keyword1", "keyword2", "keyword3"]
      }}
    }}
  ],
  "sellerInsights": {{
    "trustScore": number,
    "marketPositioning": "string describing brand position",
    "growthPotential": "High" | "Medium" | "Low",
    "conversionFriction": "High" | "Medium" | "Low"
  }},
  "visualAnalysis": {{
    "bannerClarity": "assessment of banner effectiveness",
    "couponDetected": boolean,
    "couponFeedback": "string",
    "visualTone": "string describing visual style"
  }},
  "growthScopes": [
    {{
      "title": "Growth area title",
      "score": number,
      "description": "Detailed description of the growth opportunity",
      "priority": "Immediate" | "Mid-term" | "Long-term"
    }}
  ]
}}"""
        
        models = ['models/gemini-2.5-flash', 'models/gemini-2.0-flash', 'models/gemini-2.0-flash-001']
        analysis = None
        
        for model_name in models:
            try:
                print(f"Consulting {model_name}...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content(
                    [prompt, {"mime_type": "image/jpeg", "data": img_str}], 
                    generation_config={"response_mime_type": "application/json"},
                    request_options={"timeout": 600}
                )
                
                if response and response.text:
                    analysis = clean_and_parse_json(response.text)
                    if analysis:
                        print(f"[OK] Audit Successful with {model_name}")
                        break
            except Exception as e:
                print(f"[ERR] Model {model_name} failed:")
                print(traceback.format_exc())
                continue

        if not analysis:
            raise Exception("AI failed to generate a valid audit. Check your API limits.")

        return {
            "analysis": {**analysis, "screenshot": img_str},
            "metadata": {"title": data["title"], "platform": "BuildMyStore"}
        }

    except Exception as e:
        print("CRITICAL ERROR IN ANALYZE_STORE:")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    try:
        print("[START] Starting Server on http://localhost:8001...")
        uvicorn.run(app, host="0.0.0.0", port=8001, log_level="info")
    except Exception as e:
        print(f"[ERR] SERVER CRASHED: {str(e)}")
        import traceback
        print(traceback.format_exc())
