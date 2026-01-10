#!/usr/bin/env python3
"""
Development server runner with automatic setup.
This script handles the complete development environment setup and server startup.
"""
import asyncio
import os
import sys
import subprocess
import time
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))


def check_mongodb_running():
    """Check if MongoDB is running."""
    try:
        import pymongo
        client = pymongo.MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=2000)
        client.server_info()
        return True
    except Exception:
        return False


def start_mongodb_docker():
    """Start MongoDB using Docker Compose."""
    try:
        result = subprocess.run(
            ["docker-compose", "up", "-d", "mongodb"],
            capture_output=True,
            text=True,
            cwd=Path(__file__).parent
        )
        if result.returncode == 0:
            print("✅ Started MongoDB with Docker Compose")
            # Wait for MongoDB to be ready
            for i in range(30):
                if check_mongodb_running():
                    return True
                time.sleep(1)
                print(f"⏳ Waiting for MongoDB to be ready... ({i+1}/30)")
            return False
        else:
            print(f"❌ Failed to start MongoDB: {result.stderr}")
            return False
    except FileNotFoundError:
        print("❌ Docker Compose not found")
        return False


def install_dependencies():
    """Install Python dependencies."""
    print("📦 Installing Python dependencies...")
    try:
        result = subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", "requirements.txt"
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print("✅ Dependencies installed successfully")
            return True
        else:
            print(f"❌ Failed to install dependencies: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ Error installing dependencies: {e}")
        return False


async def initialize_database():
    """Initialize database with sample data."""
    print("🗄️  Initializing database...")
    try:
        from app.db.init_db import init_database
        await init_database()
        return True
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False


def check_env_file():
    """Check if .env file exists and has required variables."""
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ .env file not found")
        print("   Run 'python setup_dev.py' to create it")
        return False
    
    # Check for required variables
    required_vars = [
        "JWT_SECRET",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
        "ADMIN_PASSWORD_HASH"
    ]
    
    with open(env_path, 'r') as f:
        content = f.read()
    
    missing_vars = []
    for var in required_vars:
        if f"{var}=" not in content or f"{var}=your_" in content or f"{var}=change-" in content:
            missing_vars.append(var)
    
    if missing_vars:
        print("⚠️  Missing or placeholder environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("   Please update your .env file with actual values")
        return False
    
    return True


def start_server():
    """Start the FastAPI development server."""
    print("🚀 Starting FastAPI development server...")
    try:
        # Use uvicorn directly
        os.execvp("uvicorn", [
            "uvicorn",
            "app.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload",
            "--reload-dir", "app"
        ])
    except FileNotFoundError:
        print("❌ uvicorn not found. Installing...")
        subprocess.run([sys.executable, "-m", "pip", "install", "uvicorn[standard]"])
        os.execvp("uvicorn", [
            "uvicorn",
            "app.main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload",
            "--reload-dir", "app"
        ])


async def main():
    """Main development server startup routine."""
    print("🔧 Kosmix Spaces Backend Development Server")
    print("=" * 50)
    
    # Check if this is first run
    if len(sys.argv) > 1 and sys.argv[1] == "--setup":
        print("🔄 Running initial setup...")
        from setup_dev import setup_development_environment
        await setup_development_environment()
        return
    
    # Check environment file
    if not check_env_file():
        print("\n💡 Tip: Run 'python run_dev.py --setup' for automatic setup")
        return
    
    # Install dependencies
    if not install_dependencies():
        return
    
    # Check MongoDB
    print("🔍 Checking MongoDB connection...")
    if not check_mongodb_running():
        print("⚠️  MongoDB not running. Attempting to start with Docker...")
        if not start_mongodb_docker():
            print("❌ Could not start MongoDB")
            print("   Please start MongoDB manually:")
            print("   - Docker: docker-compose up -d mongodb")
            print("   - Local: mongod")
            print("   - Homebrew: brew services start mongodb-community")
            return
    else:
        print("✅ MongoDB is running")
    
    # Initialize database
    if not await initialize_database():
        print("⚠️  Database initialization failed, but continuing...")
    
    print("\n🎉 Setup complete! Starting server...")
    print("📍 API will be available at: http://localhost:8000")
    print("📚 API docs at: http://localhost:8000/docs")
    print("🔄 Server will auto-reload on code changes")
    print("\n" + "=" * 50)
    
    # Start the server
    start_server()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        sys.exit(1)