@echo off
title Insane Search Playground Launcher
echo ===================================================
echo   Insane Search Playground Launcher
echo ===================================================
echo.

:: Setup environment variables
set PYTHONPATH=skills/insane-search
set PYTHONIOENCODING=utf-8

:: 1. Check if uv is installed (preferred)
uv --version >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] uv is detected. Setting up Node environment...
    goto setup_node_and_run_uv
)

:: 2. Check if python is installed
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] Python is detected. Setting up Node environment...
    set PYTHON_CMD=python
    goto setup_node_and_run_pip
)

:: 3. Check if py (Python launcher) is installed
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo [INFO] py (Python Launcher) is detected. Setting up Node environment...
    set PYTHON_CMD=py
    goto setup_node_and_run_pip
)

echo [ERROR] Neither 'uv', 'python', nor 'py' was found in your PATH!
echo Please install Python (or uv) and try again.
pause
exit /b 1

:setup_node_and_run_uv
:: Check Node/Playwright
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js is not installed or not in PATH!
    echo Playwright browser fallback will not work without Node.js.
) else (
    if not exist "node_modules\playwright" (
        echo [INFO] Installing Playwright Node.js modules...
        cmd.exe /c npm install playwright playwright-extra puppeteer-extra-plugin-stealth
        cmd.exe /c npx playwright install chrome
    )
)
echo [INFO] Launching server using uv...
start "" cmd /c "timeout /t 3 >nul && start http://127.0.0.1:8000"
uv run --with fastapi --with uvicorn --with pydantic --with curl_cffi --with beautifulsoup4 --with pyyaml --with yt-dlp python app/main.py
goto end

:setup_node_and_run_pip
:: Check Node/Playwright
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [WARNING] Node.js is not installed or not in PATH!
    echo Playwright browser fallback will not work without Node.js.
) else (
    if not exist "node_modules\playwright" (
        echo [INFO] Installing Playwright Node.js modules...
        cmd.exe /c npm install playwright playwright-extra puppeteer-extra-plugin-stealth
        cmd.exe /c npx playwright install chrome
    )
)
echo [INFO] Installing Python packages using pip...
%PYTHON_CMD% -m pip install fastapi uvicorn pydantic curl_cffi beautifulsoup4 pyyaml yt-dlp

echo [INFO] Launching server using standard python...
start "" cmd /c "timeout /t 3 >nul && start http://127.0.0.1:8000"
%PYTHON_CMD% app/main.py
goto end

:end
pause
