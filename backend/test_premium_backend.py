"""Test script for premium workspace platform backend."""
import asyncio
import sys
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.services.slug_service import (
    slugify, 
    generate_hash_suffix, 
    generate_slug, 
    resolve_slug_collision,
    validate_slug_format
)
from app.services.premium_listing_service import (
    create_premium_listing,
    get_premium_listing_by_slug,
    listing_to_public_response
)


async def test_slug_service():
    """Test slug generation and management."""
    print("🔗 Testing Slug Service")
    print("-" * 30)
    
    # Test slugify function
    test_cases = [
        ("WeWork India", "wework-india"),
        ("Connaught Place", "connaught-place"),
        ("Premium Office Space!", "premium-office-space"),
        ("Multiple---Hyphens", "multiple-hyphens"),
        ("  Leading & Trailing  ", "leading-trailing")
    ]
    
    for input_text, expected in test_cases:
        result = slugify(input_text)
        status = "✅" if result == expected else "❌"
        print(f"   {status} slugify('{input_text}') = '{result}' (expected: '{expected}')")
    
    # Test hash suffix generation
    hash_suffix = generate_hash_suffix("507f1f77bcf86cd799439011")
    print(f"   ✅ Hash suffix: {hash_suffix} (length: {len(hash_suffix)})")
    
    # Test slug generation
    slug_data = generate_slug("WeWork India", "Connaught Place", "Premium Office")
    expected_slug = "/listing/wework-india/connaught-place/premium-office"
    status = "✅" if slug_data["slug"] == expected_slug else "❌"
    print(f"   {status} Generated slug: {slug_data['slug']}")
    
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
        is_valid = validate_slug_format(slug)
        status = "✅" if is_valid else "❌"
        print(f"   {status} Valid slug: {slug}")
    
    for slug in invalid_slugs:
        is_valid = validate_slug_format(slug)
        status = "✅" if not is_valid else "❌"
        print(f"   {status} Invalid slug: {slug}")
    
    print("   ✅ Slug service tests completed\n")


async def test_premium_listing_service():
    """Test premium listing management."""
    print("🏢 Testing Premium Listing Service")
    print("-" * 35)
    
    try:
        # Connect to database
        await connect_to_mongo()
        
        # Check if we have sample data
        from app.db.mongodb import get_database
        db = get_database()
        
        partner_count = await db.partners.count_documents({})
        listing_count = await db.premium_listings.count_documents({})
        
        print(f"   📊 Database status: {partner_count} partners, {listing_count} listings")
        
        if partner_count == 0:
            print("   ⚠️  No partners found. Run setup_premium.py to create sample data.")
            return
        
        # Get a sample partner
        partner = await db.partners.find_one({"status": "ACTIVE"})
        if not partner:
            print("   ⚠️  No active partners found.")
            return
        
        print(f"   👤 Using partner: {partner['workspaceBrandName']}")
        
        # Test listing creation
        listing_data = {
            "displayName": "Test Premium Workspace",
            "overview": "A test workspace for verifying the premium listing system functionality.",
            "locality": "Test Locality",
            "city": "Delhi",
            "amenities": ["WiFi", "AC", "Parking"],
            "highlights": ["Test Location", "Premium Features"]
        }
        
        print("   🏗️  Creating test listing...")
        created_listing = await create_premium_listing(
            partner_id=str(partner["_id"]),
            listing_data=listing_data
        )
        
        print(f"   ✅ Created listing: {created_listing['displayName']}")
        print(f"   🔗 Slug: {created_listing['slugData']['slug']}")
        
        # Test slug-based retrieval
        print("   🔍 Testing slug-based retrieval...")
        retrieved_listing = await get_premium_listing_by_slug(created_listing['slugData']['slug'])
        
        if retrieved_listing:
            print("   ✅ Successfully retrieved listing by slug")
        else:
            print("   ❌ Failed to retrieve listing by slug")
        
        # Test public response conversion
        print("   🌐 Testing public response conversion...")
        public_response = listing_to_public_response(created_listing)
        
        # Verify no internal data is exposed
        has_exact_address = "exactAddress" in str(public_response)
        has_admin_notes = "adminNotes" in str(public_response)
        
        if not has_exact_address and not has_admin_notes:
            print("   ✅ Public response properly filters internal data")
        else:
            print("   ❌ Public response exposes internal data")
        
        # Clean up test listing
        await db.premium_listings.delete_one({"_id": created_listing["_id"]})
        print("   🧹 Cleaned up test listing")
        
        print("   ✅ Premium listing service tests completed\n")
        
    except Exception as e:
        print(f"   ❌ Premium listing service test failed: {e}\n")
    finally:
        await close_mongo_connection()


async def test_database_indexes():
    """Test database indexes are properly created."""
    print("🔍 Testing Database Indexes")
    print("-" * 28)
    
    try:
        await connect_to_mongo()
        from app.db.mongodb import get_database
        db = get_database()
        
        # Check premium listings indexes
        indexes = await db.premium_listings.list_indexes().to_list(length=None)
        index_names = [idx["name"] for idx in indexes]
        
        required_indexes = [
            "slugData.slug_1",
            "partnerId_1", 
            "verificationStatus_1",
            "location.locality_1"
        ]
        
        for required_index in required_indexes:
            if required_index in index_names:
                print(f"   ✅ Index exists: {required_index}")
            else:
                print(f"   ❌ Missing index: {required_index}")
        
        print(f"   📊 Total indexes on premium_listings: {len(indexes)}")
        print("   ✅ Database index tests completed\n")
        
    except Exception as e:
        print(f"   ❌ Database index test failed: {e}\n")
    finally:
        await close_mongo_connection()


async def test_configuration():
    """Test configuration and environment setup."""
    print("⚙️  Testing Configuration")
    print("-" * 24)
    
    try:
        from app.core.config import get_settings
        settings = get_settings()
        
        config_tests = [
            ("MongoDB URI", bool(settings.MONGODB_URI)),
            ("JWT Secret", bool(settings.JWT_SECRET)),
            ("Cloudinary Cloud Name", bool(settings.CLOUDINARY_CLOUD_NAME)),
            ("Cloudinary API Key", bool(settings.CLOUDINARY_API_KEY)),
            ("Admin Email", bool(settings.ADMIN_EMAIL)),
            ("CORS Origins", bool(settings.CORS_ORIGINS))
        ]
        
        all_configured = True
        for config_name, is_configured in config_tests:
            status = "✅" if is_configured else "❌"
            print(f"   {status} {config_name}: {'Configured' if is_configured else 'Missing'}")
            if not is_configured:
                all_configured = False
        
        if all_configured:
            print("   ✅ All configuration tests passed\n")
        else:
            print("   ⚠️  Some configuration is missing. Check your .env file.\n")
        
    except Exception as e:
        print(f"   ❌ Configuration test failed: {e}\n")


async def main():
    """Run all tests."""
    print("🧪 Premium Workspace Platform Backend Tests")
    print("=" * 45)
    print()
    
    # Test configuration first
    await test_configuration()
    
    # Test slug service (no database required)
    await test_slug_service()
    
    # Test database-dependent features
    await test_database_indexes()
    await test_premium_listing_service()
    
    print("🎉 All tests completed!")
    print("=" * 45)
    print()
    print("Next steps:")
    print("1. Start the server: python run_dev.py")
    print("2. Visit API docs: http://localhost:8000/docs")
    print("3. Test endpoints with the frontend")


if __name__ == "__main__":
    asyncio.run(main())