import os
import sys
import google.generativeai as genai
from dotenv import load_dotenv

# Set UTF-8 encoding for Windows console
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding='utf-8')

load_dotenv(".env.local")
api_key = os.getenv("GEMINI_API_KEY")

if not api_key:
    print("Error: API Key not found")
else:
    genai.configure(api_key=api_key)
    print("Listing available models...")
    try:
        for m in genai.list_models():
            if 'generateContent' in m.supported_generation_methods:
                print(f"[OK] {m.name}")
    except Exception as e:
        print(f"[ERR] Error: {str(e)}")
