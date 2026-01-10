#!/usr/bin/env python3
"""
Simple backend test to verify everything is working.
"""
import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))


async def test_database_connection():
    """Test MongoDB connection."""
    try:
        from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection
        
        print("🔄 Testing database connection...")
        await connect_to_mongo()
        db = get_database()
        
        # Test ping
        result = await db.command("ping")
        print("✅ Database connection successful")
        
        # Test collections
        collections = await db.list_collection_names()
        print(f"📊 Found {len(collections)} collections: {', '.join(collections)}")
        
        await close_mongo_connection()
        return True
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        return False


async def test_models():
    """Test Pydantic models."""
    try:
        from app.models.listing import WorkspaceListing
        from app.models.partner import PartnerAccount
        from app.models.lead import EnquiryLead
        from datetime import datetime
        
        print("🔄 Testing Pydantic models...")
        
        # Test listing model
        listing_data = {
            "slug": "test-listing",
            "partnerId": "507f1f77bcf86cd799439011",
            "displayName": "Test Workspace",
            "locality": "Test Area",
            "workspaceTypes": ["DEDICATED_DESKS"],
            "seatCapacity": {"minSeats": 5, "maxSeats": 20},
            "availabilityStatus": "AVAILABLE",
            "budgetBandId": "15k-25k",
            "budgetDisplayText": "₹15,000 - ₹25,000",
            "accessHours": "24/7",
            "overview": "Test workspace overview"
        }
        
        listing = WorkspaceListing(**listing_data)
        print("✅ Listing model validation successful")
        
        # Test partner model
        partner_data = {
            "workspaceBrandName": "Test Brand",
            "contactName": "John Doe",
            "phone": "+919876543210",
            "email": "test@example.com",
            "passwordHash": "hashed_password"
        }
        
        partner = PartnerAccount(**partner_data)
        print("✅ Partner model validation successful")
        
        # Test lead model
        lead_data = {
            "name": "Jane Smith",
            "phone": "+919876543211",
            "email": "jane@example.com",
            "preferredLocalities": ["Test Area"],
            "source": "WEBSITE"
        }
        
        lead = EnquiryLead(**lead_data)
        print("✅ Lead model validation successful")
        
        return True
    except Exception as e:
        print(f"❌ Model validation failed: {e}")
        return False


async def test_services():
    """Test service layer."""
    try:
        from app.services.listing_service import generate_slug, ensure_unique_slug
        
        print("🔄 Testing services...")
        
        # Test slug generation
        slug = generate_slug("Test Workspace", "Connaught Place")
        print(f"✅ Generated slug: {slug}")
        
        return True
    except Exception as e:
        print(f"❌ Service test failed: {e}")
        return False


async def test_config():
    """Test configuration loading."""
    try:
        from app.core.config import get_settings
        
        print("🔄 Testing configuration...")
        settings = get_settings()
        
        print(f"✅ App environment: {settings.APP_ENV}")
        print(f"✅ Database: {settings.MONGODB_DB}")
        print(f"✅ CORS origins: {len(settings.cors_origins_list)} configured")
        
        return True
    except Exception as e:
        print(f"❌ Configuration test failed: {e}")
        return False


async def test_security():
    """Test security utilities."""
    try:
        from app.core.security import create_access_token, verify_password, get_password_hash
        
        print("🔄 Testing security...")
        
        # Test password hashing
        password = "test123"
        hashed = get_password_hash(password)
        is_valid = verify_password(password, hashed)
        
        if is_valid:
            print("✅ Password hashing and verification working")
        else:
            print("❌ Password verification failed")
            return False
        
        # Test JWT token creation
        token = create_access_token({"sub": "test@example.com"})
        if token:
            print("✅ JWT token creation working")
        else:
            print("❌ JWT token creation failed")
            return False
        
        return True
    except Exception as e:
        print(f"❌ Security test failed: {e}")
        return False


async def run_all_tests():
    """Run all tests."""
    print("🧪 Running Backend Tests")
    print("=" * 40)
    
    tests = [
        ("Configuration", test_config),
        ("Models", test_models),
        ("Services", test_services),
        ("Security", test_security),
        ("Database", test_database_connection),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 {test_name} Tests:")
        try:
            if await test_func():
                passed += 1
            else:
                print(f"❌ {test_name} tests failed")
        except Exception as e:
            print(f"❌ {test_name} tests crashed: {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} passed")
    
    if passed == total:
        print("🎉 All tests passed! Backend is ready.")
        return True
    else:
        print("⚠️  Some tests failed. Check the output above.")
        return False


async def main():
    """Main test runner."""
    if len(sys.argv) > 1 and sys.argv[1] == "--help":
        print("Backend Test Suite")
        print("=" * 30)
        print("This script tests core backend functionality without starting the server.")
        print()
        print("Usage: python test_backend.py")
        print()
        print("Tests:")
        print("- Configuration loading")
        print("- Pydantic model validation")
        print("- Service layer functions")
        print("- Security utilities")
        print("- Database connection")
        return
    
    success = await run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    asyncio.run(main())