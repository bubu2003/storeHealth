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

load_dotenv(".env.local")

app = FastAPI(title="Store Health Bridge")

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    print(f"✅ GEMINI_API_KEY Loaded: {api_key[:5]}...{api_key[-5:]}")
else:
    print("❌ ERROR: GEMINI_API_KEY not found in .env.local")

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
            # 60s timeout for slow e-commerce sites
            print(f"Browsing to {url}...")
            await page.goto(url, wait_until="networkidle", timeout=60000)
            await asyncio.sleep(3) 
            
            # High-res capture
            preview_bytes = await page.screenshot(full_page=True, type='jpeg', quality=70)
            title = await page.title()
            
            return {
                "screenshot": preview_bytes, 
                "title": title, 
                "platform": "BuildMyStore", 
                "description": "N/A"
            }
        finally:
            await browser.close()

def clean_and_parse_json(text):
    """Aggressively finds and parses the first valid JSON object in a string."""
    # Remove markdown code blocks if present
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    text = text.strip()

    # Find the FIRST '{' and the LAST '}'
    start = text.find('{')
    end = text.rfind('}')
    
    if start == -1 or end == -1 or end < start:
        return None
        
    json_str = text[start:end+1]
    
    try:
        return json.loads(json_str)
    except Exception as e:
        print(f"JSON PARSE ERROR: {str(e)}")
        # If it failed, maybe there's extra garbage inside the braces? 
        # But usually, it's because the AI truncated the response.
        return None

@app.post("/analyze")
async def analyze_store(request: AnalyzeRequest):
    if not api_key:
        raise HTTPException(status_code=500, detail="GEMINI_API_KEY missing")

    try:
        # 1. Capture the site
        data = await capture_screenshots(request.url)
        
        # 2. Encode for AI
        img_str = base64.b64encode(data['screenshot']).decode()
        
        # 3. Ask Gemini
        prompt = f"""
        Analyze this screenshot of the store: {request.url}
        Shop Title: {data['title']}

        IMPORTANT: Return ONLY a valid JSON object. No conversation.
        
        JSON SCHEMA:
        {{
            "score": number,
            "categories": {{ "seo": number, "content": number, "conversion": number, "technical": number, "ux": number }},
            "summary": "2-sentence professional status.",
            "recommendations": [
                {{ "id": "1", "title": "string", "description": "string", "impact": "High", "effort": "Quick Win", "category": "SEO", "currentValue": "string", "suggestedValue": "string", "whyItMatters": "string" }}
            ],
            "specificProductFixes": [
                {{ "originalName": "string", "optimizedName": "string", "reason": "string", "details": {{ "materials": "string", "style": "string", "seoKeywords": ["string"] }} }}
            ],
            "sellerInsights": {{ "trustScore": number, "marketPositioning": "string", "growthPotential": "High", "conversionFriction": "Low" }},
            "growthScopes": [{{ "title": "string", "score": 50, "description": "string", "priority": "Immediate" }}],
            "visualAnalysis": {{ "bannerClarity": "Good", "couponDetected": false, "couponFeedback": "N/A", "visualTone": "Modern" }}
        }}
        """
        
        # Try models in priority order
        models = ['models/gemini-2.0-flash', 'models/gemini-flash-latest']
        analysis = None
        
        for model_name in models:
            try:
                print(f"Consulting {model_name}...")
                model = genai.GenerativeModel(model_name)
                response = model.generate_content([
                    prompt,
                    {"mime_type": "image/jpeg", "data": img_str}
                ], generation_config={"response_mime_type": "application/json"})
                
                if response and response.text:
                    analysis = clean_and_parse_json(response.text)
                    if analysis:
                        print(f"✅ Audit Successful with {model_name}")
                        break
            except Exception as e:
                print(f"Model {model_name} failed: {str(e)}")
                continue

        if not analysis:
            raise Exception("AI failed to generate a valid audit. Check your API limits and store URL.")

        return {
            "analysis": {
                **analysis,
                "screenshot": img_str
            },
            "metadata": {
                "title": data["title"],
                "platform": data["platform"]
            }
        }

    except Exception as e:
        print(f"CRITICAL ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
