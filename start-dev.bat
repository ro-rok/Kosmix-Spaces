@echo off
echo Starting Kosmix Spaces Development Environment...
echo.

REM Check if we're in the project root
if not exist "backend" (
    echo Error: backend directory not found. Please run this script from the project root.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo Error: frontend directory not found. Please run this script from the project root.
    pause
    exit /b 1
)

REM Start Backend
echo Starting Backend Server...
cd backend

REM Check if venv exists
if not exist "venv" (
    echo Warning: Virtual environment not found in backend directory.
    echo Creating virtual environment...
    python -m venv venv
    echo Activating virtual environment...
    call venv\Scripts\activate.bat
    echo Upgrading pip, setuptools, and wheel...
    python -m pip install --upgrade pip setuptools wheel
    echo Installing dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo.
        echo Retrying with pre-built wheels only...
        pip install --only-binary=:all: -r requirements.txt
        if errorlevel 1 (
            echo.
            echo ERROR: Failed to install dependencies. Please check the error above.
            pause
            exit /b 1
        )
    )
) else (
    echo Activating virtual environment...
)

REM Start backend with venv activated
start "Kosmix Backend" cmd /k "call venv\Scripts\activate.bat && python -m uvicorn app.main:app --reload"
cd ..

REM Wait a moment for backend to initialize
timeout /t 2 /nobreak >nul

REM Start Frontend
echo Starting Frontend Server...
cd frontend
start "Kosmix Frontend" cmd /k "npm run dev"
cd ..

echo.
echo ========================================
echo Both servers are starting!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo Press any key to close this window (servers will continue running)
echo ========================================
pause >nul
