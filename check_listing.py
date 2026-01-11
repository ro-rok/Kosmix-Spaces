import asyncio
import sys
sys.path.append('backend')
from app.db.mongodb import get_database
from bson import ObjectId

async def check_listing():
    db = get_database()
    
    # Find the listing mentioned in the context
    listing = await db.premium_listings.find_one({
        'partnerId': ObjectId('695fe4aa5c656cc31ecde7c6'),
        'displayName': 'asdasd'
    })
    
    if listing:
        print('Found listing:')
        print(f'  ID: {listing["_id"]}')
        print(f'  Display Name: {listing["displayName"]}')
        print(f'  Published: {listing.get("isPublished", False)}')
        print(f'  Status: {listing.get("verificationStatus", "UNKNOWN")}')
        print('  Offerings enabled:')
        for offering_type, offering in listing.get('offerings', {}).items():
            enabled = offering.get('enabled', False)
            print(f'    {offering_type}: {enabled}')
    else:
        print('Listing not found')

if __name__ == "__main__":
    asyncio.run(check_listing())