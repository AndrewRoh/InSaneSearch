# Implementation Plan - Playground Prompt & Gemini API Integration

We will simplify the Insane Search Playground interface by removing the Examples panel, adding fields for custom Prompts and Gemini API keys, and integrating Gemini processing to format fetched page contents (e.g., as CSV).

---

## Proposed Changes

### 1. Web Backend Updates (`app/main.py`)
- Update `FetchRequest` to accept:
  - `prompt: str | None = None`
  - `gemini_key: str | None = None`
- Implement a helper `call_gemini(api_key, content, prompt)` using `curl_cffi` to hit the Gemini REST API (`gemini-2.5-flash`).
- In `api_fetch`, after calling `fetch`, if `prompt` and `gemini_key` are provided, call `call_gemini` and include `llm_output` in the JSON response payload.

### 2. Web UI Frontend Updates

#### [MODIFY] [index.html](file:///e:/Projects/InSaneSearch/app/static/index.html)
- Remove the `.examples-section` from the sidebar.
- Add a new `form-group` for the **User Prompt** textarea.
- Add a new `form-group` for the **Gemini API Key** input (password type).
- Add a **"LLM Response"** tab button and tab pane containing a readonly textarea and a **"Download CSV"** button.

#### [MODIFY] [style.css](file:///e:/Projects/InSaneSearch/app/static/style.css)
- Style the Prompt textarea and the Gemini API key input.
- Style the "LLM Response" tab pane and the download button to match the premium theme.

#### [MODIFY] [app.js](file:///e:/Projects/InSaneSearch/app/static/app.js)
- Bind the custom Prompt and Gemini API key form values in the AJAX request payload.
- In `renderResults`:
  - Renders `data.llm_output` in the new Gemini Response tab.
  - Automatically activates the "LLM Response" tab if LLM processing was performed.
  - Detects if the response contains structured rows and displays the "Download CSV" button to download the parsed output.

---

## Verification Plan

### Manual Verification
- Start the server with `run.bat`.
- Open `http://localhost:8000`.
- Verify the Examples section is gone.
- Enter target URL, prompt, and Gemini API key.
- Verify that the Gemini Response is populated and download button works.
