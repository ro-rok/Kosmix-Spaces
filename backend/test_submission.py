import asyncio
from app.db.mongodb import get_database, connect_to_mongo
from bson import ObjectId

async def test_submission():
    await connect_to_mongo()
    db = get_database()
    
    # Update one of the existing listings to be approved and published for testing
    listing_id = ObjectId('6963759d5f8aa4d9ce351440')
    
    result = await db.premium_listings.update_one(
        {"_id": listing_id},
        {
            "$set": {
                "isPublished": True,
                "verificationStatus": "APPROVED_VERIFIED",
                "adminNotes": "Approved by admin for testing"
            }
        }
    )
    
    if result.modified_count > 0:
        print(f"Updated listing {listing_id} to be approved and published")
        
        # Verify the update
        updated_listing = await db.premium_listings.find_one({"_id": listing_id})
        print(f"Verification:")
        print(f"  Published: {updated_listing.get('isPublished', False)}")
        print(f"  Status: {updated_listing.get('verificationStatus', 'UNKNOWN')}")
        print(f"  Admin Notes: {updated_listing.get('adminNotes', 'None')}")
        
        # Check if it would appear in public query
        public_query = {
            "isPublished": True,
            "verificationStatus": "APPROVED_VERIFIED"
        }
        
        public_listings = await db.premium_listings.find(public_query).to_list(length=10)
        print(f"\nListings that would appear in public view: {len(public_listings)}")
        for listing in public_listings:
            print(f"  - {listing['displayName']} (ID: {listing['_id']})")
    else:
        print("Failed to update listing")

if __name__ == "__main__":
    asyncio.run(test_submission())