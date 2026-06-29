# Task List - Playground Prompt & Gemini API Integration

- [ ] **Web Backend Updates**
  - [ ] Update `app/main.py` models to accept `prompt` and `gemini_key`
  - [ ] Implement `call_gemini` helper function using `curl_cffi` REST call
  - [ ] Call `call_gemini` in `api_fetch` if parameters are provided and return `llm_output`

- [ ] **Web UI Frontend Updates**
  - [ ] Remove Examples section from `app/static/index.html`
  - [ ] Add Prompt textarea and Gemini API key password input in `app/static/index.html`
  - [ ] Add "LLM Response" tab button and pane in `app/static/index.html`
  - [ ] Update CSS styles in `app/static/style.css` for new inputs and LLM Response tab
  - [ ] Bind custom prompt and api key inputs in `app/static/app.js` payload
  - [ ] Renders `llm_output` in "LLM Response" tab, auto-switch to it, and implement "Download CSV" functionality in `app/static/app.js`

- [ ] **Testing & Verification**
  - [ ] Start server and verify that UI renders correctly without Examples panel
  - [ ] Verify custom prompt and Gemini API processing on a target URL
  - [ ] Document final walkthrough
