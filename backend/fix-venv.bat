@echo off
echo Fixing virtual environment...
echo.

cd /d "%~dp0"

if not exist "venv" (
    echo Error: Virtual environment not found. Please run start-dev.bat first.
    pause
    exit /b 1
)

echo Activating virtual environment...
call venv\Scripts\activate.bat

echo Upgrading pip and setuptools...
python -m pip install --upgrade pip setuptools wheel

echo Installing dependencies...
pip install -r requirements.txt

if errorlevel 1 (
    echo.
    echo ERROR: Installation failed. Try running:
    echo   pip install --upgrade pip setuptools wheel
    echo   pip install -r requirements.txt
) else (
    echo.
    echo Success! Virtual environment is ready.
)

pause
