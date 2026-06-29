import sys
import os
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import uvicorn

# Dynamically add the skills/insane-search directory to sys.path
HERE = os.path.dirname(os.path.abspath(__file__))
SKILL_ROOT = os.path.abspath(os.path.join(HERE, "..", "skills", "insane-search"))
if SKILL_ROOT not in sys.path:
    sys.path.insert(0, SKILL_ROOT)

try:
    from engine import fetch
except ImportError as e:
    # Fallback to local import if structure is different
    sys.path.insert(0, os.path.abspath(os.path.join(HERE, "..")))
    from engine import fetch

app = FastAPI(title="Insane Search Web UI")

class FetchRequest(BaseModel):
    url: str
    selectors: list[str] | None = None
    device: str = "auto"
    timeout: int = 25
    user_hint: dict | None = None
    force_playwright: bool = False
    prompt: str | None = None
    gemini_key: str | None = None

def call_gemini(api_key: str, content: str, prompt: str) -> str:
    from curl_cffi import requests
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    system_instruction = (
        "You are a helpful data extraction and analysis assistant. "
        "Your task is to analyze the provided web page content and execute the user's instructions. "
        "If the user asks to save or output as CSV, generate a clean, raw CSV block without markdown tags unless requested, "
        "so it can be easily copied or downloaded. Do not write introductory or concluding remarks if producing data like CSV."
    )
    
    prompt_text = (
        f"{system_instruction}\n\n"
        f"Web Page Content:\n"
        f"[BEGIN UNTRUSTED WEB CONTENT]\n{content}\n[END UNTRUSTED WEB CONTENT]\n\n"
        f"User Instruction: {prompt}"
    )
    
    payload = {
        "contents": [
            {
                "parts": [
                    {"text": prompt_text}
                ]
            }
        ]
    }
    
    try:
        resp = requests.post(url, headers=headers, json=payload, timeout=60)
        if resp.status_code == 200:
            res_data = resp.json()
            candidates = res_data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
            return f"Error: No text returned in candidates. Response: {resp.text}"
        else:
            return f"Gemini API Error (status {resp.status_code}): {resp.text}"
    except Exception as e:
        return f"Gemini API Call Exception: {type(e).__name__}: {str(e)}"

@app.post("/api/fetch")
def api_fetch(req: FetchRequest):
    try:
        # If force_playwright is True, set max_attempts=0 to skip the curl grid
        # and escalate to Playwright fallback immediately after the initial probe.
        max_attempts = 0 if req.force_playwright else None
        
        # call the fetch engine
        result = fetch(
            req.url,
            success_selectors=req.selectors,
            device_class=req.device,
            timeout=req.timeout,
            user_hint=req.user_hint,
            max_attempts=max_attempts,
            enable_playwright=True, # local Node Playwright fallback
            enable_phase0=True,
        )
        
        # Build response payload and manually include the content (which is omitted in to_dict)
        payload = result.to_dict()
        payload["content"] = result.content
        
        # Process content with Gemini if API key and prompt are provided
        if result.ok and req.gemini_key and req.prompt:
            payload["llm_output"] = call_gemini(req.gemini_key, result.content, req.prompt)
        elif not result.ok and req.gemini_key and req.prompt:
            payload["llm_output"] = "Error: Fetch failed, skipping Gemini analysis."
        
        return JSONResponse(content=payload)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"{type(e).__name__}: {str(e)}")

# Mount static files
static_dir = os.path.join(HERE, "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
