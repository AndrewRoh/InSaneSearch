# Walkthrough - Insane Search Web UI Playground Updates

We have successfully updated the Insane Search Playground web application and the underlying fetch engine to support YouTube subtitles extraction, dynamic CSR selectors, and interactive example scenarios.

## Accomplishments

### 1. YouTube Subtitles Support (`engine/phase0.py`)
- Modified `_youtube` to run `yt-dlp` from the PATH, falling back to `sys.executable -m yt_dlp` or `python -m yt_dlp` depending on environment availability.
- Implemented timedtext JSON3 subtitle downloading and parsing. If a video contains subtitles (prioritizing Korean `ko` first, then English `en`), the engine fetches and formats the subtitles into a clean paragraph text, which is appended to the video metadata (Title, Channel, Description).

### 2. Windows Encoding Fix (`engine/executor.py`)
- Added `encoding="utf-8"` to the `subprocess.run` call that runs local Node templates. This resolves `UnicodeDecodeError` (e.g. `cp949`) on Korean Windows environments when parsing HTML containing multi-byte characters.

### 3. Simplified UI & Gemini API Integration (`app/static/` & `app/main.py`)
- **Custom Prompts & API Keys**: Removed the sidebar Examples section. Added direct form inputs for a custom **User Prompt** and a **Gemini API Key**.
- **Gemini REST Call**: Integrated `curl_cffi` requests to call the `gemini-2.5-flash` model endpoint, enabling automated processing of bypassed website content.
- **LLM Response Viewer & CSV Download**: Introduced an **LLM Response** tab to display the processed text. Added an interactive download button that extracts and downloads generated tabular/CSV content directly as a local `.csv` file.

---

## Verification & Testing Results

1. **YouTube Subtitle Summarization**:
   - URL: `https://www.youtube.com/watch?v=vjSZIyYd0NI`
   - Prompt: `이 영상의 자막 내용을 요약해서 보여줘`
   - Verified that the engine extracted the metadata + subtitles, Gemini summarized the content, and outputted the summary inside the new LLM Response tab.

2. **Naver Shopping Festa Data Extraction**:
   - URL: `https://shopping.naver.com/festa/onsale`
   - Prompt: `이 페이지에 있는 상품 목록을 정리해서 CSV 파일 형식으로 표로 출력해라`
   - Verified that the page loaded via browser fallback, Gemini extracted the lists, and the "Download CSV" button appeared to save the results.

---

## How to Run

### Method 1: Double-click Launcher (Windows)
Simply double-click the **[run.bat](file:///e:/Projects/InSaneSearch/run.bat)** file in the repository root.
- It will automatically verify Python and Node.js environments.
- Installs any missing dependencies.
- Starts the FastAPI local server.
- Opens `http://localhost:8000` automatically in your default browser.

### Method 2: Manual Terminal Execution
1. Make sure Node.js dependencies are installed:
   ```bash
   npm install playwright playwright-extra puppeteer-extra-plugin-stealth
   npx playwright install chrome
   ```
2. Start the FastAPI server:
   ```bash
   $env:PYTHONPATH="skills/insane-search"; $env:PYTHONIOENCODING="utf-8"; uv run --with fastapi --with uvicorn --with pydantic --with curl_cffi --with beautifulsoup4 --with pyyaml --with yt-dlp python app/main.py
   ```
3. Open `http://localhost:8000` in your web browser.
