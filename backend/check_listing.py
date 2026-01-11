import asyncio
from app.db.mongodb import get_database, connect_to_mongo
from bson import ObjectId

async def check_listing():
    await connect_to_mongo()
    db = get_database()
    
    # Check total count of premium listings
    total_count = await db.premium_listings.count_documents({})
    print(f'Total premium listings: {total_count}')
    
    # Find any listings for this partner
    partner_listings = await db.premium_listings.find({
        'partnerId': ObjectId('695fe4aa5c656cc31ecde7c6')
    }).to_list(length=10)
    
    print(f'Listings for partner 695fe4aa5c656cc31ecde7c6: {len(partner_listings)}')
    
    for listing in partner_listings:
        print(f'  - {listing["displayName"]} (Status: {listing.get("verificationStatus", "UNKNOWN")})')
    
    # Check for any approved listings
    approved_listings = await db.premium_listings.find({
        'verificationStatus': 'APPROVED_VERIFIED'
    }).to_list(length=10)
    
    print(f'\nApproved listings: {len(approved_listings)}')
    for listing in approved_listings:
        print(f'  - {listing["displayName"]} (Published: {listing.get("isPublished", False)})')
        print(f'    Partner: {listing["partnerId"]}')
        print(f'    Offerings enabled:')
        for offering_type, offering in listing.get('offerings', {}).items():
            enabled = offering.get('enabled', False)
            if enabled:
                print(f'      {offering_type}: {enabled}')
    
    # Check for published listings
    published_listings = await db.premium_listings.find({
        'isPublished': True
    }).to_list(length=10)
    
    print(f'\nPublished listings: {len(published_listings)}')
    for listing in published_listings:
        print(f'  - {listing["displayName"]} (Status: {listing.get("verificationStatus", "UNKNOWN")})')
    
    # Find the listing mentioned in the context
    listing = await db.premium_listings.find_one({
        'partnerId': ObjectId('695fe4aa5c656cc31ecde7c6'),
        'displayName': 'asdasdasd'
    })
    
    if listing:
        print('\nFound listing:')
        print(f'  ID: {listing["_id"]}')
        print(f'  Display Name: {listing["displayName"]}')
        print(f'  Published: {listing.get("isPublished", False)}')
        print(f'  Status: {listing.get("verificationStatus", "UNKNOWN")}')
        print('  Offerings enabled:')
        for offering_type, offering in listing.get('offerings', {}).items():
            enabled = offering.get('enabled', False)
            print(f'    {offering_type}: {enabled}')
    else:
        print('\nListing "asdasdasd" not found')

if __name__ == "__main__":
    asyncio.run(check_listing())