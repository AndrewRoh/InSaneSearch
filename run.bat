@echo off
title Insane Search Playground Launcher
echo ===================================================
echo   Insane Search Playground Launcher
echo ===================================================
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python and try again.
    pause
    exit /b 1
)

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js is not installed or not in PATH!
    echo Playwright browser fallback will not work without Node.js.
) else (
    :: Check if playwright npm modules are installed locally
    if not exist "node_modules\playwright" (
        echo [INFO] Installing Playwright Node.js modules...
        cmd.exe /c npm install playwright playwright-extra puppeteer-extra-plugin-stealth
        cmd.exe /c npx playwright install chrome
    )
)

:: Setup environment variables
set PYTHONPATH=skills/insane-search
set PYTHONIOENCODING=utf-8

:: Check if uv is installed
uv --version >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] Launching server using uv...
    
    :: Launch browser after a short delay in the background
    start "" cmd /c "timeout /t 3 >nul && start http://127.0.0.1:8000"
    
    :: Run the server
    uv run --with fastapi --with uvicorn --with pydantic --with curl_cffi --with beautifulsoup4 --with pyyaml --with yt-dlp python app/main.py
) else (
    echo [INFO] uv is not installed. Installing Python packages using pip...
    pip install fastapi uvicorn pydantic curl_cffi beautifulsoup4 pyyaml yt-dlp
    
    echo [INFO] Launching server using standard python...
    
    :: Launch browser after a short delay in the background
    start "" cmd /c "timeout /t 3 >nul && start http://127.0.0.1:8000"
    
    :: Run the server
    python app/main.py
)

pause
