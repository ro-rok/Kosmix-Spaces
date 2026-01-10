#!/usr/bin/env python3
"""
Backend readiness verification script.
Tests that all components are properly configured and ready to run.
"""
import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

def test_imports():
    """Test that all required modules can be imported."""
    print("🔍 Testing imports...")
    
    try:
        from app.core.config import get_settings
        print("✅ Core configuration")
        
        from app.models.premium_listing import PremiumListing
        print("✅ Premium listing model")
        
        from app.services.premium_listing_service import listing_to_public_response
        print("✅ Premium listing service")
        
        from app.services.slug_service import generate_slug
        print("✅ Slug service")
        
        from app.routers.premium_public import router
        print("✅ Premium public router")
        
        from app.main import app
        print("✅ FastAPI application")
        
        return True
    except ImportError as e:
        print(f"❌ Import error: {e}")
        return False

def test_configuration():
    """Test configuration loading."""
    print("\n🔧 Testing configuration...")
    
    try:
        from app.core.config import get_settings
        settings = get_settings()
        
        print(f"✅ Environment: {settings.app_env}")
        print(f"✅ Database: {settings.mongodb_db}")
        print(f"✅ JWT configured: {'Yes' if settings.jwt_secret else 'No'}")
        print(f"✅ CORS origins: {len(settings.cors_origins_list)} configured")
        
        return True
    except Exception as e:
        print(f"❌ Configuration error: {e}")
        return False

def test_models():
    """Test Pydantic model validation."""
    print("\n📋 Testing models...")
    
    try:
        from app.models.premium_listing import PremiumListing, OfferingData
        from app.schemas.lead import EnquiryLeadCreate
        from app.schemas.visit import SiteVisitCreate, PreferredSlot
        
        # Test offering model
        offering = OfferingData(
            type="private-offices",
            title="Test Office",
            description="Test description",
            features=["WiFi", "AC"],
            enabled=True,
            photos=[]
        )
        print("✅ Offering model validation")
        
        # Test lead model
        lead = EnquiryLeadCreate(
            name="Test User",
            phone="9876543210",
            preferredLocalities=["connaught-place"],
            teamSizeBand="5-10",
            budgetBandId="₹₹",
            spaceType="private-cabin"
        )
        print("✅ Lead model validation")
        
        # Test visit model
        slot = PreferredSlot(date="2024-01-15", timeSlot="10:00 AM - 11:00 AM")
        visit = SiteVisitCreate(
            name="Test User",
            phone="9876543210",
            listingIds=["507f1f77bcf86cd799439011"],
            preferredSlots=[slot],
            visitorCount=2
        )
        print("✅ Visit model validation")
        
        return True
    except Exception as e:
        print(f"❌ Model validation error: {e}")
        return False

def test_services():
    """Test service functions."""
    print("\n🛠️ Testing services...")
    
    try:
        from app.services.slug_service import generate_slug, slugify
        from app.services.premium_listing_service import format_price_display
        
        # Test slug generation
        slug = generate_slug("Test Workspace", "Connaught Place", "Premium Office")
        print(f"✅ Generated slug: {slug}")
        
        # Test slugify
        clean_slug = slugify("Test & Special Characters!")
        print(f"✅ Slugified text: {clean_slug}")
        
        # Test price formatting
        price = format_price_display(25000, "month", None)
        print(f"✅ Formatted price: {price}")
        
        return True
    except Exception as e:
        print(f"❌ Service test error: {e}")
        return False

def test_api_structure():
    """Test API router structure."""
    print("\n🌐 Testing API structure...")
    
    try:
        from app.main import app
        
        # Get all routes
        routes = []
        for route in app.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                for method in route.methods:
                    if method != 'HEAD':  # Skip HEAD methods
                        routes.append(f"{method} {route.path}")
        
        # Check for key endpoints
        key_endpoints = [
            "GET /api/public/listings",
            "GET /api/public/listings/{slug}",
            "POST /api/public/leads",
            "POST /api/public/site-visits",
            "GET /api/public/localities"
        ]
        
        found_endpoints = []
        for endpoint in key_endpoints:
            if any(endpoint.replace("{slug}", "{path}") in route or endpoint in route for route in routes):
                found_endpoints.append(endpoint)
                print(f"✅ {endpoint}")
        
        if len(found_endpoints) == len(key_endpoints):
            print("✅ All key endpoints found")
            return True
        else:
            print(f"❌ Missing endpoints: {set(key_endpoints) - set(found_endpoints)}")
            return False
            
    except Exception as e:
        print(f"❌ API structure test error: {e}")
        return False

def test_environment_file():
    """Test .env file configuration."""
    print("\n📄 Testing environment file...")
    
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
        "ADMIN_EMAIL"
    ]
    
    found_vars = []
    for var in required_vars:
        if f"{var}=" in content:
            found_vars.append(var)
            print(f"✅ {var}")
    
    if len(found_vars) == len(required_vars):
        print("✅ All required environment variables found")
        return True
    else:
        missing = set(required_vars) - set(found_vars)
        print(f"❌ Missing variables: {missing}")
        return False

def main():
    """Run all verification tests."""
    print("🧪 Backend Readiness Verification")
    print("=" * 50)
    
    tests = [
        ("Imports", test_imports),
        ("Configuration", test_configuration),
        ("Models", test_models),
        ("Services", test_services),
        ("API Structure", test_api_structure),
        ("Environment File", test_environment_file)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                print(f"❌ {test_name} test failed")
        except Exception as e:
            print(f"❌ {test_name} test error: {e}")
    
    print("\n" + "=" * 50)
    print(f"📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 Backend is ready!")
        print("\n🚀 To start the backend:")
        print("   Option 1: python run_dev.py")
        print("   Option 2: docker-compose up -d")
        print("   Option 3: uvicorn app.main:app --reload")
        print("\n📚 API docs will be at: http://localhost:8000/docs")
        return True
    else:
        print("❌ Backend has issues that need to be resolved")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)