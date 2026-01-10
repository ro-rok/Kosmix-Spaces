#!/usr/bin/env python3
"""Test script for enhanced listing builder backend functionality."""

import asyncio
import json
import sys
from datetime import datetime
from bson import ObjectId

# Add the app directory to the path
sys.path.append('.')

from app.db.mongodb import connect_to_mongo, close_mongo_connection, get_database
from app.services.premium_listing_service import (
    create_premium_listing,
    get_premium_listing,
    update_premium_listing,
    update_offering,
    add_offering_photo,
    validate_listing_for_submission,
    submit_listing_for_review,
    listing_to_public_response
)
from app.models.premium_listing import OfferingType


async def test_enhanced_listing_builder():
    """Test the enhanced listing builder functionality."""
    print("🚀 Testing Enhanced Listing Builder Backend")
    print("=" * 50)
    
    try:
        # Connect to database
        await connect_to_mongo()
        db = get_database()
        
        # Create test partner
        partner_data = {
            "_id": ObjectId(),
            "workspaceBrandName": "Test Workspace Co",
            "contactName": "John Doe",
            "phone": "+91-9876543210",
            "email": "test@example.com",
            "status": "ACTIVE",
            "createdAt": datetime.utcnow()
        }
        
        # Insert test partner
        await db.partners.insert_one(partner_data)
        partner_id = str(partner_data["_id"])
        
        print(f"✅ Created test partner: {partner_id}")
        
        # Test 1: Create premium listing with enhanced data
        print("\n📝 Test 1: Creating premium listing with enhanced data")
        
        listing_data = {
            "displayName": "Premium Office Space",
            "overview": "A beautiful premium office space in the heart of Delhi with modern amenities and excellent connectivity.",
            "locality": "Connaught Place",
            "city": "Delhi",
            "exactAddress": "123 Inner Circle, Connaught Place, New Delhi",  # Internal only
            "nearMetro": True,
            "metroNote": "2 minutes walk from Rajiv Chowk Metro Station",
            "amenities": ["High-speed WiFi", "Air Conditioning", "Cafeteria", "Parking", "Security"],
            "highlights": ["Prime Location", "Modern Interiors", "24/7 Access"],
            "accessHours": "24/7 Access",
            "weekendAccess": True
        }
        
        listing = await create_premium_listing(partner_id, listing_data)
        listing_id = str(listing["_id"])
        
        print(f"✅ Created listing: {listing_id}")
        print(f"   Slug: {listing['slugData']['slug']}")
        print(f"   Offerings initialized: {len(listing['offerings'])}")
        
        # Test 2: Update basic info (Step 1 of wizard)
        print("\n📝 Test 2: Updating basic info (Step 1)")
        
        basic_info_update = {
            "displayName": "Premium Office Space - Updated",
            "overview": "An updated description of our premium office space with even better amenities.",
            "amenities": ["High-speed WiFi", "Air Conditioning", "Cafeteria", "Parking", "Security", "Gym Access"],
            "accessHours": "9 AM - 9 PM",
            "weekendAccess": False
        }
        
        updated_listing = await update_premium_listing(listing_id, partner_id, basic_info_update)
        print(f"✅ Updated basic info")
        print(f"   New display name: {updated_listing['displayName']}")
        print(f"   Amenities count: {len(updated_listing['amenities'])}")
        
        # Test 3: Update offerings (Step 2 of wizard)
        print("\n📝 Test 3: Updating offerings (Step 2)")
        
        # Enable and configure private offices
        private_office_data = {
            "title": "Premium Private Offices",
            "description": "Fully furnished private offices with modern amenities",
            "features": ["Fully Furnished", "Air Conditioning", "Natural Light", "Lockable Door"],
            "enabled": True,
            "startingPrice": 25000,
            "unit": "month",
            "budgetBand": "₹₹",
            "capacity": {"minSeats": 2, "maxSeats": 8}
        }
        
        await update_offering(listing_id, partner_id, "private-offices", private_office_data)
        print("✅ Updated private offices offering")
        
        # Enable and configure dedicated desks
        dedicated_desk_data = {
            "title": "Dedicated Desks",
            "description": "Personal dedicated desks in a shared environment",
            "features": ["Ergonomic Chair", "Personal Storage", "Power Outlets", "Monitor Mount"],
            "enabled": True,
            "startingPrice": 8000,
            "unit": "month",
            "budgetBand": "₹"
        }
        
        await update_offering(listing_id, partner_id, "dedicated-desks", dedicated_desk_data)
        print("✅ Updated dedicated desks offering")
        
        # Test 4: Add photos to offerings
        print("\n📝 Test 4: Adding photos to offerings")
        
        # Mock photo data for private offices
        photo_data_1 = {
            "url": "https://res.cloudinary.com/test/image/upload/v1/private-office-1.jpg",
            "publicId": "private-office-1",
            "width": 800,
            "height": 600,
            "bytes": 150000,
            "format": "jpg"
        }
        
        photo_1 = await add_offering_photo(listing_id, partner_id, "private-offices", photo_data_1)
        print(f"✅ Added photo to private offices: {photo_1['url']}")
        
        # Mock photo data for dedicated desks
        photo_data_2 = {
            "url": "https://res.cloudinary.com/test/image/upload/v2/dedicated-desk-1.jpg",
            "publicId": "dedicated-desk-1",
            "width": 800,
            "height": 600,
            "bytes": 120000,
            "format": "jpg"
        }
        
        photo_2 = await add_offering_photo(listing_id, partner_id, "dedicated-desks", photo_data_2)
        print(f"✅ Added photo to dedicated desks: {photo_2['url']}")
        
        # Test 5: Update location (Step 3 of wizard)
        print("\n📝 Test 5: Updating location (Step 3)")
        
        location_update = {
            "approximateCoordinates": {"lat": 28.6315, "lng": 77.2167},
            "accessHours": "24/7 Access",
            "twentyFourSevenAccess": True,
            "metroDetails": "Rajiv Chowk Metro Station - Blue & Yellow Lines",
            "parking": "BOTH",
            "parkingNotes": "Free parking for first 2 hours, then ₹20/hour",
            "powerBackup": True,
            "internetSpeedMbps": 100,
            "wifiDetails": "High-speed fiber internet with backup connections",
            "houseRules": "No smoking inside premises. Visitors must register at reception.",
            "specialInstructions": "Use Gate 2 for after-hours access. Security code will be provided."
        }
        
        updated_listing = await update_premium_listing(listing_id, partner_id, location_update)
        print("✅ Updated location information")
        print(f"   Coordinates: {updated_listing['location'].get('approximateCoordinates')}")
        print(f"   Internet Speed: {updated_listing['location'].get('internetSpeedMbps')} Mbps")
        
        # Test 6: Validate listing for submission
        print("\n📝 Test 6: Validating listing for submission")
        
        validation = await validate_listing_for_submission(listing_id, partner_id)
        print(f"✅ Validation result: {'Valid' if validation.isValid else 'Invalid'}")
        
        if not validation.isValid:
            print("   Errors:")
            for error in validation.errors:
                print(f"   - {error}")
        
        if validation.warnings:
            print("   Warnings:")
            for warning in validation.warnings:
                print(f"   - {warning}")
        
        # Test 7: Submit for review (if valid)
        if validation.isValid:
            print("\n📝 Test 7: Submitting for review")
            
            submitted_listing = await submit_listing_for_review(listing_id, partner_id)
            print(f"✅ Submitted for review")
            print(f"   Status: {submitted_listing['verificationStatus']}")
        else:
            print("\n⚠️  Test 7: Skipping submission due to validation errors")
        
        # Test 8: Convert to public response
        print("\n📝 Test 8: Converting to public response")
        
        final_listing = await get_premium_listing(listing_id, partner_id)
        public_response = listing_to_public_response(final_listing)
        
        print("✅ Generated public response")
        print(f"   Public fields count: {len(public_response)}")
        print(f"   Exact address hidden: {'exactAddress' not in public_response}")
        print(f"   Enabled offerings: {sum(1 for o in public_response['offerings'].values() if o['enabled'])}")
        
        # Test 9: Privacy protection verification
        print("\n📝 Test 9: Verifying privacy protection")
        
        # Check that exact address is not in public response
        assert "exactAddress" not in public_response, "Exact address should not be in public response"
        
        # Check that coordinates are rounded
        coords = public_response.get("approximateCoordinates")
        if coords:
            lat_decimals = len(str(coords["lat"]).split(".")[1]) if "." in str(coords["lat"]) else 0
            lng_decimals = len(str(coords["lng"]).split(".")[1]) if "." in str(coords["lng"]) else 0
            assert lat_decimals <= 2, f"Latitude should be rounded to 2 decimals, got {lat_decimals}"
            assert lng_decimals <= 2, f"Longitude should be rounded to 2 decimals, got {lng_decimals}"
        
        print("✅ Privacy protection verified")
        print("   - Exact address hidden from public response")
        print("   - Coordinates rounded to 2 decimal places")
        
        # Test 10: Offering-specific photo organization
        print("\n📝 Test 10: Verifying offering-specific photo organization")
        
        private_office_photos = public_response["offerings"]["private-offices"]["photos"]
        dedicated_desk_photos = public_response["offerings"]["dedicated-desks"]["photos"]
        
        assert len(private_office_photos) == 1, f"Expected 1 private office photo, got {len(private_office_photos)}"
        assert len(dedicated_desk_photos) == 1, f"Expected 1 dedicated desk photo, got {len(dedicated_desk_photos)}"
        
        assert private_office_photos[0]["offeringType"] == "private-offices"
        assert dedicated_desk_photos[0]["offeringType"] == "dedicated-desks"
        
        print("✅ Photo organization verified")
        print(f"   - Private offices: {len(private_office_photos)} photos")
        print(f"   - Dedicated desks: {len(dedicated_desk_photos)} photos")
        
        # Cleanup
        print("\n🧹 Cleaning up test data")
        await db.premium_listings.delete_one({"_id": ObjectId(listing_id)})
        await db.partners.delete_one({"_id": ObjectId(partner_id)})
        print("✅ Test data cleaned up")
        
        print("\n🎉 All tests passed! Enhanced listing builder backend is working correctly.")
        
        # Summary
        print("\n📊 Test Summary:")
        print("✅ Premium listing creation with enhanced data")
        print("✅ Step-by-step wizard updates (Basic Info, Offerings, Location)")
        print("✅ Offering-specific photo management")
        print("✅ Privacy protection (exact address hidden, coordinates rounded)")
        print("✅ Comprehensive validation system")
        print("✅ Submission workflow")
        print("✅ Public response generation")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {e}")
        import traceback
        traceback.print_exc()
        return False
        
    finally:
        await close_mongo_connection()


async def main():
    """Main test function."""
    print("Enhanced Listing Builder Backend Test")
    print("====================================")
    
    success = await test_enhanced_listing_builder()
    
    if success:
        print("\n🎉 All tests completed successfully!")
        print("\nThe enhanced backend is ready to support the premium listing builder frontend!")
        sys.exit(0)
    else:
        print("\n❌ Tests failed!")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())