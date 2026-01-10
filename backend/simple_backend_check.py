#!/usr/bin/env python3
"""
Simple backend readiness check without external dependencies.
"""
import os
import sys
from pathlib import Path

def check_file_structure():
    """Check if all required files exist."""
    print("📁 Checking file structure...")
    
    required_files = [
        "app/main.py",
        "app/core/config.py",
        "app/models/premium_listing.py",
        "app/services/premium_listing_service.py",
        "app/routers/premium_public.py",
        "requirements.txt",
        ".env"
    ]
    
    missing_files = []
    for file_path in required_files:
        if not Path(file_path).exists():
            missing_files.append(file_path)
        else:
            print(f"✅ {file_path}")
    
    if missing_files:
        print(f"❌ Missing files: {missing_files}")
        return False
    
    print("✅ All required files present")
    return True

def check_env_configuration():
    """Check .env file configuration."""
    print("\n🔧 Checking environment configuration...")
    
    env_path = Path(".env")
    if not env_path.exists():
        print("❌ .env file not found")
        return False
    
    with open(env_path, 'r') as f:
        content = f.read()
    
    required_vars = [
        "MONGODB_URI",
        "MONGODB_DB",
        "JWT_SECRET",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET"
    ]
    
    configured_vars = []
    for var in required_vars:
        if f"{var}=" in content and not f"{var}=your_" in content:
            configured_vars.append(var)
            print(f"✅ {var}")
        else:
            print(f"⚠️  {var} (needs configuration)")
    
    if len(configured_vars) >= 3:  # At least basic config
        print("✅ Basic configuration present")
        return True
    else:
        print("❌ Insufficient configuration")
        return False

def check_api_structure():
    """Check API router structure by reading files."""
    print("\n🌐 Checking API structure...")
    
    try:
        # Check main.py for router includes
        with open("app/main.py", 'r') as f:
            main_content = f.read()
        
        required_routers = [
            "premium_public",
            "auth_partner",
            "auth_admin",
            "premium_listings"
        ]
        
        found_routers = []
        for router in required_routers:
            if router in main_content:
                found_routers.append(router)
                print(f"✅ {router} router")
        
        if len(found_routers) >= 3:
            print("✅ Core routers present")
            return True
        else:
            print(f"❌ Missing routers: {set(required_routers) - set(found_routers)}")
            return False
            
    except Exception as e:
        print(f"❌ Error checking API structure: {e}")
        return False

def check_database_models():
    """Check database model files."""
    print("\n📋 Checking database models...")
    
    model_files = [
        "app/models/premium_listing.py",
        "app/models/common.py",
        "app/models/partner.py",
        "app/models/lead.py"
    ]
    
    found_models = []
    for model_file in model_files:
        if Path(model_file).exists():
            found_models.append(model_file)
            print(f"✅ {model_file}")
    
    if len(found_models) >= 3:
        print("✅ Core models present")
        return True
    else:
        print("❌ Missing core models")
        return False

def check_services():
    """Check service files."""
    print("\n🛠️ Checking services...")
    
    service_files = [
        "app/services/premium_listing_service.py",
        "app/services/slug_service.py",
        "app/services/cloudinary_service.py"
    ]
    
    found_services = []
    for service_file in service_files:
        if Path(service_file).exists():
            found_services.append(service_file)
            print(f"✅ {service_file}")
    
    if len(found_services) >= 2:
        print("✅ Core services present")
        return True
    else:
        print("❌ Missing core services")
        return False

def main():
    """Run all checks."""
    print("🔍 Simple Backend Readiness Check")
    print("=" * 40)
    
    checks = [
        ("File Structure", check_file_structure),
        ("Environment Config", check_env_configuration),
        ("API Structure", check_api_structure),
        ("Database Models", check_database_models),
        ("Services", check_services)
    ]
    
    passed = 0
    total = len(checks)
    
    for check_name, check_func in checks:
        try:
            if check_func():
                passed += 1
            else:
                print(f"❌ {check_name} check failed")
        except Exception as e:
            print(f"❌ {check_name} check error: {e}")
    
    print("\n" + "=" * 40)
    print(f"📊 Results: {passed}/{total} checks passed")
    
    if passed >= 4:  # Allow one failure
        print("🎉 Backend structure is ready!")
        print("\n🚀 To start the backend:")
        print("   1. Install dependencies: pip install -r requirements.txt")
        print("   2. Start MongoDB (Docker or local)")
        print("   3. Run: python run_dev.py")
        print("\n📚 API docs will be at: http://localhost:8000/docs")
        return True
    else:
        print("❌ Backend needs setup")
        print("\n💡 Run: python setup_dev.py")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)