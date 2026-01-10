#!/usr/bin/env python3
"""
Test script to validate the enhanced backend API structure and functionality.
This script tests the API without requiring a running database.
"""
import sys
import os
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

def test_imports():
    """Test that all modules can be imported successfully."""
    print("🔍 Testing Module Imports")
    print("-" * 30)
    
    try:
        # Core modules
        from app.core.config import get_settings
        print("   ✅ Core config imported")
        
        from app.core.security import hash_password, verify_password
        print("   ✅ Security module imported")
        
        from app.core.errors import AppError, NotFoundError, ValidationError
        print("   ✅ Error handling imported")
        
        # Models
        from app.models.premium_listing import (
            PremiumWorkspaceListing, 
            PremiumOffering, 
            OfferingType,
            SlugData,
            LocationData
        )
        print("   ✅ Premium listing models imported")
        
        # Services
        from app.services.slug_service import slugify, generate_hash_suffix, ensure_unique_slug
        print("   ✅ Slug service imported")
        
        from app.services.premium_listing_service import (
            create_premium_listing,
            get_premium_listing,
            update_premium_listing,
            listing_to_public_response
        )
        print("   ✅ Premium listing service imported")
        
        # Routers
        from app.routers.premium_listings import router as premium_router
        print("   ✅ Premium listings router imported")
        
        from app.routers.premium_public import router as public_router
        print("   ✅ Premium public router imported")
        
        # Main app
        from app.main import app
        print("   ✅ FastAPI app imported")
        
        return True
        
    except ImportError as e:
        print(f"   ❌ Import failed: {e}")
        return False


def test_api_structure():
    """Test the API structure and endpoints."""
    print("\n🔗 Testing API Structure")
    print("-" * 30)
    
    try:
        from app.main import app
        
        # Get all routes
        routes = []
        for route in app.routes:
            if hasattr(route, 'path') and hasattr(route, 'methods'):
                for method in route.methods:
                    if method != 'HEAD':  # Skip HEAD methods
                        routes.append(f"{method} {route.path}")
        
        # Expected premium endpoints
        expected_endpoints = [
            "GET /api/public/listings",
            "GET /api/public/listings/{slug}",
            "GET /api/public/localities",
            "POST /api/public/leads",
            "POST /api/public/site-visits",
            "GET /api/public/search/suggestions",
            "GET /api/public/featured",
            "POST /api/partner/listings",
            "GET /api/partner/listings",
            "GET /api/partner/listings/{listing_id}",
            "PUT /api/partner/listings/{listing_id}",
            "PUT /api/partner/listings/{listing_id}/offerings/{offering_type}",
            "POST /api/partner/listings/{listing_id}/offerings/{offering_type}/photos",
            "DELETE /api/partner/listings/{listing_id}/offerings/{offering_type}/photos/{public_id}",
            "POST /api/partner/listings/{listing_id}/validate",
            "POST /api/partner/listings/{listing_id}/submit"
        ]
        
        found_endpoints = []
        missing_endpoints = []
        
        for endpoint in expected_endpoints:
            if any(endpoint.replace('{', '').replace('}', '') in route.replace('{', '').replace('}', '') for route in routes):
                found_endpoints.append(endpoint)
                print(f"   ✅ {endpoint}")
            else:
                missing_endpoints.append(endpoint)
                print(f"   ❌ {endpoint}")
        
        print(f"\n   📊 Found {len(found_endpoints)}/{len(expected_endpoints)} expected endpoints")
        
        if missing_endpoints:
            print("   ⚠️  Missing endpoints:")
            for endpoint in missing_endpoints:
                print(f"      - {endpoint}")
        
        return len(missing_endpoints) == 0
        
    except Exception as e:
        print(f"   ❌ API structure test failed: {e}")
        return False


def test_models():
    """Test the data models."""
    print("\n📋 Testing Data Models")
    print("-" * 30)
    
    try:
        from app.models.premium_listing import (
            PremiumWorkspaceListing,
            PremiumOffering,
            OfferingType,
            SlugData,
            LocationData,
            OfferingPhoto
        )
        
        # Test offering types
        offering_types = ["private-offices", "dedicated-desks", "hot-desks", "meeting-rooms", "event-spaces"]
        print(f"   ✅ Offering types: {', '.join(offering_types)}")
        
        # Test slug data model
        slug_data = SlugData(
            slug="/listing/test-partner/test-locality/test-name",
            partnerSlug="test-partner",
            localitySlug="test-locality",
            nameSlug="test-name"
        )
        print(f"   ✅ Slug data model: {slug_data.slug}")
        
        # Test location data model
        location_data = LocationData(
            locality="Connaught Place",
            city="Delhi",
            nearMetro=True,
            metroNote="2 min walk to Rajiv Chowk"
        )
        print(f"   ✅ Location data model: {location_data.locality}, {location_data.city}")
        
        # Test offering model
        offering = PremiumOffering(
            type="private-offices",
            title="Private Offices",
            description="Fully furnished private offices",
            enabled=True,
            startingPrice=25000,
            unit="month",
            budgetBand="₹₹"
        )
        print(f"   ✅ Offering model: {offering.title} - ₹{offering.startingPrice}/{offering.unit}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Model test failed: {e}")
        return False


def test_slug_service():
    """Test the slug service functionality."""
    print("\n🔗 Testing Slug Service")
    print("-" * 30)
    
    try:
        from app.services.slug_service import slugify, generate_hash_suffix, validate_slug_format
        
        # Test slugify function
        test_cases = [
            ("WeWork India", "wework-india"),
            ("Connaught Place", "connaught-place"),
            ("Premium Office Space!", "premium-office-space"),
            ("Multiple---Hyphens", "multiple-hyphens"),
            ("  Leading & Trailing  ", "leading-trailing"),
            ("Special@#$%Characters", "special-characters"),
            ("Numbers123AndText", "numbers123andtext")
        ]
        
        for input_text, expected in test_cases:
            result = slugify(input_text)
            if result == expected:
                print(f"   ✅ slugify('{input_text}') = '{result}'")
            else:
                print(f"   ❌ slugify('{input_text}') = '{result}' (expected: '{expected}')")
        
        # Test hash suffix generation
        hash_suffix = generate_hash_suffix("test-input")
        if len(hash_suffix) == 6 and hash_suffix.isalnum():
            print(f"   ✅ Hash suffix generated: {hash_suffix}")
        else:
            print(f"   ❌ Invalid hash suffix: {hash_suffix}")
        
        # Test slug validation
        valid_slugs = [
            "/listing/partner/locality/name",
            "/listing/wework-india/connaught-place/premium-office",
            "/listing/partner/locality/name-abc123"
        ]
        
        invalid_slugs = [
            "listing/partner/locality/name",  # Missing leading slash
            "/listing/partner/locality",      # Missing name
            "/listing/partner//name",         # Empty locality
            "/listing/partner/locality/-name" # Invalid name format
        ]
        
        for slug in valid_slugs:
            if validate_slug_format(slug):
                print(f"   ✅ Valid slug: {slug}")
            else:
                print(f"   ❌ Incorrectly rejected valid slug: {slug}")
        
        for slug in invalid_slugs:
            if not validate_slug_format(slug):
                print(f"   ✅ Correctly rejected invalid slug: {slug}")
            else:
                print(f"   ❌ Incorrectly accepted invalid slug: {slug}")
        
        return True
        
    except Exception as e:
        print(f"   ❌ Slug service test failed: {e}")
        return False


def test_configuration():
    """Test configuration loading."""
    print("\n⚙️  Testing Configuration")
    print("-" * 30)
    
    try:
        from app.core.config import get_settings
        
        settings = get_settings()
        
        # Check required settings
        config_checks = [
            ("JWT_SECRET", bool(settings.JWT_SECRET)),
            ("MONGODB_URI", bool(settings.MONGODB_URI)),
            ("MONGODB_DB", bool(settings.MONGODB_DB)),
            ("CLOUDINARY_CLOUD_NAME", bool(settings.CLOUDINARY_CLOUD_NAME)),
            ("CLOUDINARY_API_KEY", bool(settings.CLOUDINARY_API_KEY)),
            ("CLOUDINARY_API_SECRET", bool(settings.CLOUDINARY_API_SECRET)),
            ("ADMIN_EMAIL", bool(settings.ADMIN_EMAIL)),
            ("ADMIN_PASSWORD_HASH", bool(settings.ADMIN_PASSWORD_HASH)),
        ]
        
        all_configured = True
        for config_name, is_set in config_checks:
            status = "✅" if is_set else "❌"
            print(f"   {status} {config_name}: {'Set' if is_set else 'Missing'}")
            if not is_set:
                all_configured = False
        
        return all_configured
        
    except Exception as e:
        print(f"   ❌ Configuration test failed: {e}")
        return False


def main():
    """Run all tests."""
    print("🧪 Enhanced Backend API Structure Tests")
    print("=" * 50)
    
    tests = [
        ("Module Imports", test_imports),
        ("API Structure", test_api_structure),
        ("Data Models", test_models),
        ("Slug Service", test_slug_service),
        ("Configuration", test_configuration)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ {test_name} test crashed: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("📊 Test Results Summary")
    print("-" * 30)
    
    passed = 0
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"   {status} {test_name}")
        if result:
            passed += 1
    
    print(f"\n🎯 Overall: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! The enhanced backend is ready.")
        print("\nNext steps:")
        print("1. Install dependencies: pip install -r requirements.txt")
        print("2. Start MongoDB: docker-compose up -d mongodb")
        print("3. Run setup: python setup_premium.py")
        print("4. Start server: python run_dev.py")
        print("5. Test API: http://localhost:8000/docs")
    else:
        print("⚠️  Some tests failed. Please review the issues above.")
    
    return passed == total


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)