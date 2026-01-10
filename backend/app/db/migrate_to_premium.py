"""Migration script to convert legacy listings to premium format."""
from datetime import datetime
from typing import Dict, Any
from bson import ObjectId
from app.db.mongodb import get_database
from app.services.slug_service import ensure_unique_slug
from app.models.premium_listing import PremiumOffering, OfferingType


async def migrate_legacy_to_premium():
    """Migrate legacy listings to premium format."""
    db = get_database()
    
    print("Starting migration from legacy to premium listings...")
    
    # Get all legacy listings
    legacy_cursor = db.listings.find({})
    migrated_count = 0
    error_count = 0
    
    async for legacy_listing in legacy_cursor:
        try:
            # Check if already migrated
            existing = await db.premium_listings.find_one({
                "partnerId": legacy_listing["partnerId"],
                "displayName": legacy_listing["displayName"]
            })
            
            if existing:
                print(f"Skipping {legacy_listing['displayName']} - already migrated")
                continue
            
            # Get partner info for slug generation
            partner = await db.partners.find_one({"_id": legacy_listing["partnerId"]})
            if not partner:
                print(f"Partner not found for listing {legacy_listing['displayName']}")
                error_count += 1
                continue
            
            # Generate slug data
            slug_data = await ensure_unique_slug(
                partner["workspaceBrandName"],
                legacy_listing["locality"],
                legacy_listing["displayName"],
                str(legacy_listing["_id"])
            )
            
            # Map legacy workspace types to premium offerings
            offerings = _create_offerings_from_legacy(legacy_listing)
            
            # Create location data
            location_data = {
                "locality": legacy_listing["locality"],
                "city": legacy_listing.get("city", "Delhi"),
                "exactAddress": None,  # Don't migrate exact addresses for privacy
                "nearMetro": legacy_listing.get("nearMetro", False),
                "metroNote": legacy_listing.get("metroNote"),
                "approximateCoordinates": None
            }
            
            # Map photos to hero photos (legacy listings don't have offering-specific photos)
            hero_photos = []
            for photo in legacy_listing.get("photos", []):
                hero_photos.append({
                    "url": photo["url"],
                    "publicId": photo["publicId"],
                    "width": photo["width"],
                    "height": photo["height"],
                    "bytes": photo["bytes"],
                    "format": photo["format"],
                    "offeringType": "private-offices",  # Default to private offices
                    "order": len(hero_photos)
                })
            
            # Create premium listing document
            premium_listing = {
                "_id": ObjectId(),
                "partnerId": legacy_listing["partnerId"],
                "displayName": legacy_listing["displayName"],
                "overview": legacy_listing.get("overview", ""),
                "slugData": slug_data,
                "location": location_data,
                "offerings": offerings,
                "heroPhotos": hero_photos,
                "amenities": legacy_listing.get("amenities", []),
                "highlights": [],
                "verificationStatus": _map_verification_status(legacy_listing.get("verificationStatus")),
                "verificationChecks": None,
                "adminNotes": legacy_listing.get("adminNotes"),
                "publishedAt": legacy_listing.get("publishedAt"),
                "isPublished": legacy_listing.get("verificationStatus") == "APPROVED_VERIFIED",
                "viewCount": 0,
                "enquiryCount": 0,
                "lastViewedAt": None,
                "createdAt": legacy_listing.get("createdAt", datetime.utcnow()),
                "updatedAt": legacy_listing.get("updatedAt", datetime.utcnow())
            }
            
            # Insert premium listing
            await db.premium_listings.insert_one(premium_listing)
            
            print(f"Migrated: {legacy_listing['displayName']}")
            migrated_count += 1
            
        except Exception as e:
            print(f"Error migrating {legacy_listing.get('displayName', 'Unknown')}: {e}")
            error_count += 1
    
    print(f"\nMigration complete!")
    print(f"Migrated: {migrated_count} listings")
    print(f"Errors: {error_count} listings")
    
    return {"migrated": migrated_count, "errors": error_count}


def _create_offerings_from_legacy(legacy_listing: Dict[str, Any]) -> Dict[str, Dict[str, Any]]:
    """Create premium offerings from legacy workspace types."""
    offerings = {}
    
    # Initialize all offering types
    offering_types: list[OfferingType] = [
        "private-offices",
        "dedicated-desks", 
        "hot-desks",
        "meeting-rooms",
        "event-spaces"
    ]
    
    for offering_type in offering_types:
        offerings[offering_type] = {
            "type": offering_type,
            "title": _get_default_offering_title(offering_type),
            "description": "",
            "features": [],
            "enabled": False,
            "startingPrice": None,
            "unit": None,
            "budgetBand": None,
            "photos": [],
            "capacity": None,
            "availability": None
        }
    
    # Map legacy workspace types to offerings
    legacy_types = legacy_listing.get("workspaceTypes", [])
    
    for legacy_type in legacy_types:
        offering_type = _map_legacy_type_to_offering(legacy_type)
        if offering_type:
            offerings[offering_type]["enabled"] = True
            
            # Add capacity info if available
            if legacy_listing.get("seatCapacity"):
                offerings[offering_type]["capacity"] = {
                    "minSeats": legacy_listing["seatCapacity"].get("minSeats"),
                    "maxSeats": legacy_listing["seatCapacity"].get("maxSeats")
                }
            
            # Add pricing info if available
            if legacy_listing.get("budgetDisplayText"):
                offerings[offering_type]["budgetBand"] = _extract_budget_band(
                    legacy_listing["budgetDisplayText"]
                )
    
    # Enable meeting rooms if available
    if legacy_listing.get("meetingRooms", {}).get("count", 0) > 0:
        offerings["meeting-rooms"]["enabled"] = True
        offerings["meeting-rooms"]["capacity"] = {
            "roomCount": legacy_listing["meetingRooms"]["count"],
            "addonOnly": legacy_listing["meetingRooms"].get("addonOnly", True)
        }
    
    return offerings


def _map_legacy_type_to_offering(legacy_type: str) -> str:
    """Map legacy workspace type to premium offering type."""
    mapping = {
        "DEDICATED_DESKS": "dedicated-desks",
        "PRIVATE_CABINS": "private-offices",
        "MANAGED_OFFICE": "private-offices",
        "MEETING_ROOMS_ADDON": "meeting-rooms"
    }
    return mapping.get(legacy_type)


def _map_verification_status(legacy_status: str) -> str:
    """Map legacy verification status to premium status."""
    if not legacy_status:
        return "DRAFT"
    
    mapping = {
        "PENDING_REVIEW": "PENDING_REVIEW",
        "NEEDS_INFO": "NEEDS_INFO", 
        "APPROVED_VERIFIED": "APPROVED_VERIFIED",
        "REJECTED": "REJECTED",
        "SUSPENDED": "REJECTED"
    }
    
    return mapping.get(legacy_status, "DRAFT")


def _get_default_offering_title(offering_type: OfferingType) -> str:
    """Get default title for offering type."""
    titles = {
        "private-offices": "Private Offices",
        "dedicated-desks": "Dedicated Desks",
        "hot-desks": "Hot Desks", 
        "meeting-rooms": "Meeting Rooms",
        "event-spaces": "Event Spaces"
    }
    return titles.get(offering_type, offering_type.replace("-", " ").title())


def _extract_budget_band(budget_text: str) -> str:
    """Extract budget band from legacy budget display text."""
    if "10,000" in budget_text or "15,000" in budget_text:
        return "₹"
    elif "25,000" in budget_text or "50,000" in budget_text:
        return "₹₹"
    elif "75,000" in budget_text or "100,000" in budget_text:
        return "₹₹₹"
    else:
        return "₹₹"  # Default to mid-range


async def rollback_migration():
    """Rollback migration by deleting all premium listings."""
    db = get_database()
    
    print("Rolling back migration...")
    
    result = await db.premium_listings.delete_many({})
    
    print(f"Deleted {result.deleted_count} premium listings")
    
    return {"deleted": result.deleted_count}


if __name__ == "__main__":
    import asyncio
    
    async def main():
        from app.db.mongodb import connect_to_mongo, close_mongo_connection
        
        await connect_to_mongo()
        
        try:
            result = await migrate_legacy_to_premium()
            print(f"Migration result: {result}")
        finally:
            await close_mongo_connection()
    
    asyncio.run(main())