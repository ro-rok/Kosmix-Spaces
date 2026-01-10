#!/usr/bin/env python3
"""Development environment setup script."""
import asyncio
import os
import sys
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from app.core.config import get_settings
from app.db.init_db import init_database


def create_env_file():
    """Create .env file with development settings."""
    env_path = Path(".env")
    
    if env_path.exists():
        print("📄 .env file already exists")
        return
    
    env_content = """# Development Environment Configuration
APP_ENV=dev
API_HOST=0.0.0.0
API_PORT=8000

# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=kosmixspaces_dev

# JWT (Change in production!)
JWT_SECRET=dev-secret-key-change-in-production
JWT_ALG=HS256
JWT_ACCESS_TTL_MIN=60

# Cloudinary (Add your credentials)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=kosmixspaces_dev

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Admin User (Change password hash in production!)
ADMIN_EMAIL=admin@kosmix.com
ADMIN_PASSWORD_HASH=$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3L3jzHxlHO

# Note: The password hash above is for "admin123" - change this in production!
"""
    
    with open(env_path, 'w') as f:
        f.write(env_content)
    
    print("✅ Created .env file with development settings")
    print("⚠️  Please update Cloudinary credentials in .env file")


def create_docker_env():
    """Create docker-compose.override.yml for development."""
    override_path = Path("docker-compose.override.yml")
    
    if override_path.exists():
        print("📄 docker-compose.override.yml already exists")
        return
    
    override_content = """version: '3.8'

services:
  mongodb:
    ports:
      - "27017:27017"
    volumes:
      - ./data/mongodb:/data/db
    environment:
      MONGO_INITDB_DATABASE: kosmixspaces_dev

  backend:
    environment:
      - APP_ENV=dev
      - MONGODB_DB=kosmixspaces_dev
    volumes:
      - .:/app
      - /app/__pycache__
    command: uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
    ports:
      - "8000:8000"
"""
    
    with open(override_path, 'w') as f:
        f.write(override_content)
    
    print("✅ Created docker-compose.override.yml for development")


def create_gitignore_additions():
    """Add development-specific entries to .gitignore."""
    gitignore_path = Path(".gitignore")
    
    additions = """
# Development
.env
.env.local
.env.development
.env.test

# Database
data/
backups/
*.db
*.sqlite

# Logs
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# Python
__pycache__/
*.pyc
*.pyo
*.pyd
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Virtual environments
venv/
env/
ENV/
"""
    
    if gitignore_path.exists():
        with open(gitignore_path, 'r') as f:
            content = f.read()
        
        # Only add if not already present
        if ".env" not in content:
            with open(gitignore_path, 'a') as f:
                f.write(additions)
            print("✅ Updated .gitignore with development entries")
        else:
            print("📄 .gitignore already contains development entries")
    else:
        with open(gitignore_path, 'w') as f:
            f.write(additions.strip())
        print("✅ Created .gitignore with development entries")


def create_dev_scripts():
    """Create development helper scripts."""
    scripts_dir = Path("scripts")
    scripts_dir.mkdir(exist_ok=True)
    
    # Start development script
    start_dev_content = """#!/bin/bash
# Start development environment

echo "🚀 Starting Kosmix Spaces Development Environment"

# Check if .env exists
if [ ! -f .env ]; then
    echo "❌ .env file not found. Run setup_dev.py first."
    exit 1
fi

# Start MongoDB if not running
if ! pgrep -x "mongod" > /dev/null; then
    echo "🔄 Starting MongoDB..."
    # Uncomment one of these based on your MongoDB installation:
    # brew services start mongodb-community  # macOS with Homebrew
    # sudo systemctl start mongod            # Linux with systemd
    # docker-compose up -d mongodb           # Docker
fi

# Install dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Initialize database
echo "🗄️  Initializing database..."
python db_setup.py init

# Start FastAPI server
echo "🌐 Starting FastAPI server..."
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""
    
    with open(scripts_dir / "start_dev.sh", 'w') as f:
        f.write(start_dev_content)
    
    # Make executable
    os.chmod(scripts_dir / "start_dev.sh", 0o755)
    
    # Windows batch file
    start_dev_bat = """@echo off
REM Start development environment for Windows

echo 🚀 Starting Kosmix Spaces Development Environment

REM Check if .env exists
if not exist .env (
    echo ❌ .env file not found. Run setup_dev.py first.
    exit /b 1
)

REM Install dependencies
echo 📦 Installing Python dependencies...
pip install -r requirements.txt

REM Initialize database
echo 🗄️ Initializing database...
python db_setup.py init

REM Start FastAPI server
echo 🌐 Starting FastAPI server...
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
"""
    
    with open(scripts_dir / "start_dev.bat", 'w') as f:
        f.write(start_dev_bat)
    
    print("✅ Created development scripts in scripts/ directory")


async def setup_development_environment():
    """Set up complete development environment."""
    print("🔧 Setting up Kosmix Spaces Backend Development Environment")
    print("=" * 60)
    
    # Create configuration files
    create_env_file()
    create_docker_env()
    create_gitignore_additions()
    create_dev_scripts()
    
    # Create data directory
    data_dir = Path("data")
    data_dir.mkdir(exist_ok=True)
    print("✅ Created data directory")
    
    # Create backups directory
    backups_dir = Path("backups")
    backups_dir.mkdir(exist_ok=True)
    print("✅ Created backups directory")
    
    # Initialize database
    print("\n🗄️  Initializing database...")
    try:
        await init_database()
    except Exception as e:
        print(f"⚠️  Database initialization failed: {e}")
        print("   You can run 'python db_setup.py init' later when MongoDB is running")
    
    print("\n✅ Development environment setup complete!")
    print("\nNext steps:")
    print("1. Update Cloudinary credentials in .env file")
    print("2. Start MongoDB (if not using Docker)")
    print("3. Run: python db_setup.py init (if database init failed)")
    print("4. Run: uvicorn app.main:app --reload")
    print("5. Visit: http://localhost:8000/docs")


async def main():
    """Main setup function."""
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("Development Environment Setup")
        print("=" * 40)
        print("This script sets up a complete development environment for the backend.")
        print()
        print("What it does:")
        print("- Creates .env file with development settings")
        print("- Creates docker-compose.override.yml")
        print("- Updates .gitignore")
        print("- Creates development scripts")
        print("- Initializes database with sample data")
        print()
        print("Usage: python setup_dev.py")
        return
    
    await setup_development_environment()


if __name__ == "__main__":
    asyncio.run(main())