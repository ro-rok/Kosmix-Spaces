@echo off
REM Kosmix Spaces Backend Startup Script for Windows
REM This script sets up and starts the development environment

echo.
echo ========================================
echo  Kosmix Spaces Backend Development
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python 3.11+ first.
    echo    Download from: https://www.python.org/downloads/
    pause
    exit /b 1
)

REM Check if we're in the backend directory
if not exist "app\main.py" (
    echo ❌ Please run this script from the backend directory
    echo    Current directory should contain app\main.py
    pause
    exit /b 1
)

REM Check for .env file
if not exist ".env" (
    echo ⚠️  .env file not found
    echo    Running setup script...
    python setup_dev.py
    if errorlevel 1 (
        echo ❌ Setup failed
        pause
        exit /b 1
    )
    echo.
    echo ✅ Setup complete! Please update Cloudinary credentials in .env
    echo    Then run this script again.
    pause
    exit /b 0
)

REM Install dependencies
echo 📦 Installing Python dependencies...
python -m pip install -r requirements.txt
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

REM Check if MongoDB is running (try to connect)
echo 🔍 Checking MongoDB connection...
python -c "import pymongo; pymongo.MongoClient('mongodb://localhost:27017', serverSelectionTimeoutMS=2000).server_info()" >nul 2>&1
if errorlevel 1 (
    echo ⚠️  MongoDB not running
    echo.
    echo    Please start MongoDB using one of these methods:
    echo    1. Docker: docker-compose up -d mongodb
    echo    2. Local MongoDB service
    echo    3. MongoDB Compass or MongoDB Atlas
    echo.
    set /p choice="Press Enter to continue anyway, or Ctrl+C to exit: "
)

REM Initialize database
echo 🗄️  Initializing database...
python db_setup.py init
if errorlevel 1 (
    echo ⚠️  Database initialization failed, but continuing...
)

REM Run tests
echo 🧪 Running quick tests...
python test_backend.py
if errorlevel 1 (
    echo ⚠️  Some tests failed, but continuing...
)

echo.
echo 🎉 Starting FastAPI development server...
echo 📍 API will be available at: http://localhost:8000
echo 📚 API docs at: http://localhost:8000/docs
echo 🔄 Server will auto-reload on code changes
echo.
echo Press Ctrl+C to stop the server
echo ========================================
echo.

REM Start the server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

echo.
echo 👋 Server stopped
pause