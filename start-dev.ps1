Write-Host "Starting Kosmix Spaces Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the project root
if (-not (Test-Path "backend")) {
    Write-Host "Error: backend directory not found. Please run this script from the project root." -ForegroundColor Red
    pause
    exit 1
}

if (-not (Test-Path "frontend")) {
    Write-Host "Error: frontend directory not found. Please run this script from the project root." -ForegroundColor Red
    pause
    exit 1
}

# Start Backend
Write-Host "Starting Backend Server..." -ForegroundColor Yellow
Set-Location backend

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "Warning: Virtual environment not found in backend directory." -ForegroundColor Yellow
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host "Activating virtual environment..." -ForegroundColor Yellow
    & "venv\Scripts\Activate.ps1"
    Write-Host "Upgrading pip, setuptools, and wheel..." -ForegroundColor Yellow
    python -m pip install --upgrade pip setuptools wheel
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    pip install -r requirements.txt
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "Retrying with pre-built wheels only..." -ForegroundColor Yellow
        pip install --only-binary=:all: -r requirements.txt
        if ($LASTEXITCODE -ne 0) {
            Write-Host ""
            Write-Host "ERROR: Failed to install dependencies. Please check the error above." -ForegroundColor Red
            pause
            exit 1
        }
    }
}

# Start backend with venv activated
$backendCommand = "& 'venv\Scripts\Activate.ps1'; python -m uvicorn app.main:app --reload"
Start-Process powershell -ArgumentList "-NoExit", "-Command", $backendCommand -WindowStyle Normal
Set-Location ..

# Wait a moment for backend to initialize
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "Starting Frontend Server..." -ForegroundColor Yellow
Set-Location frontend
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev" -WindowStyle Normal
Set-Location ..

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "Backend: http://localhost:8000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5173" -ForegroundColor Cyan
Write-Host "API Docs: http://localhost:8000/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "Two new windows have opened for the servers." -ForegroundColor Yellow
Write-Host "You can close this window now." -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to close this window..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
