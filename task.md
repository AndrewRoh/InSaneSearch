# Task List - Playground Prompt & Gemini API Integration

- [x] **Web Backend Updates**
  - [x] Update `app/main.py` models to accept `prompt` and `gemini_key`
  - [x] Implement `call_gemini` helper function using `curl_cffi` REST call
  - [x] Call `call_gemini` in `api_fetch` if parameters are provided and return `llm_output`

- [x] **Web UI Frontend Updates**
  - [x] Remove Examples section from `app/static/index.html`
  - [x] Add Prompt textarea and Gemini API key password input in `app/static/index.html`
  - [x] Add "LLM Response" tab button and pane in `app/static/index.html`
  - [x] Update CSS styles in `app/static/style.css` for new inputs and LLM Response tab
  - [x] Bind custom prompt and api key inputs in `app/static/app.js` payload
  - [x] Renders `llm_output` in "LLM Response" tab, auto-switch to it, and implement "Download CSV" functionality in `app/static/app.js`

- [x] **Testing & Verification**
  - [x] Start server and verify that UI renders correctly without Examples panel
  - [x] Verify custom prompt and Gemini API processing on a target URL
  - [x] Document final walkthrough
