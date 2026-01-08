"""Listing service - business logic for listings."""
import re
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime
from bson import ObjectId
from app.db.mongodb import get_database
from app.models.listing import WorkspaceListing, ListingPhoto
from app.schemas.listing import (
    PublicListingCardResponse,
    PublicListingDetailResponse,
    PartnerListingResponse,
    AdminListingResponse
)
from app.core.errors import NotFoundError, ConflictError


def generate_slug(display_name: str, locality: str) -> str:
    """Generate a URL-friendly slug."""
    # Convert to lowercase and replace spaces/special chars with hyphens
    base = f"{display_name.lower()}-{locality.lower()}"
    base = re.sub(r"[^a-z0-9]+", "-", base)
    base = re.sub(r"-+", "-", base).strip("-")
    # Add timestamp for uniqueness
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    return f"{base}-{timestamp}"


async def ensure_unique_slug(slug: str, exclude_listing_id: Optional[str] = None) -> str:
    """Ensure slug is unique, append number if needed."""
    db = get_database()
    base_slug = slug
    
    counter = 1
    while True:
        query = {"slug": slug}
        if exclude_listing_id:
            query["_id"] = {"$ne": ObjectId(exclude_listing_id)}
        
        existing = await db.listings.find_one(query)
        if not existing:
            return slug
        
        slug = f"{base_slug}-{counter}"
        counter += 1


def listing_to_public_card(listing: Dict[str, Any]) -> PublicListingCardResponse:
    """Convert listing document to public card response (NO address fields)."""
    return PublicListingCardResponse(
        listingId=str(listing["_id"]),
        slug=listing["slug"],
        displayName=listing["displayName"],
        locality=listing["locality"],
        city=listing.get("city", "Delhi"),
        workspaceTypes=listing["workspaceTypes"],
        photos=[
            {
                "url": photo["url"],
                "width": photo["width"],
                "height": photo["height"]
            }
            for photo in listing.get("photos", [])
        ],
        seatCapacityMin=listing["seatCapacity"]["minSeats"],
        seatCapacityMax=listing["seatCapacity"]["maxSeats"],
        availabilityStatus=listing["availabilityStatus"],
        budgetBandId=listing["budgetBandId"],
        budgetDisplayText=listing["budgetDisplayText"],
        pricingMode=listing.get("pricingMode", "ON_ENQUIRY"),
        nearMetro=listing.get("nearMetro", False),
        metroNote=listing.get("metroNote"),
        parking=listing.get("parking", "NONE"),
        powerBackup=listing.get("powerBackup", False),
        gstInvoiceAvailable=listing.get("gstInvoiceAvailable", False),
        accessHours=listing["accessHours"],
        weekendAccess=listing.get("weekendAccess", False),
        amenities=listing.get("amenities", []),
        meetingRoomsAddon=listing.get("meetingRooms", {}).get("addonOnly", True) if listing.get("meetingRooms") else True,
        dealTags=listing.get("dealTags", []),
        isVerified=listing.get("verificationStatus") == "APPROVED_VERIFIED",
        verifiedAt=listing.get("publishedAt"),
        createdAt=listing["createdAt"]
    )


def listing_to_public_detail(listing: Dict[str, Any]) -> PublicListingDetailResponse:
    """Convert listing document to public detail response (NO address fields)."""
    meeting_rooms = listing.get("meetingRooms")
    
    return PublicListingDetailResponse(
        listingId=str(listing["_id"]),
        slug=listing["slug"],
        displayName=listing["displayName"],
        locality=listing["locality"],
        city=listing.get("city", "Delhi"),
        workspaceTypes=listing["workspaceTypes"],
        photos=[
            {
                "url": photo["url"],
                "width": photo["width"],
                "height": photo["height"]
            }
            for photo in listing.get("photos", [])
        ],
        seatCapacityMin=listing["seatCapacity"]["minSeats"],
        seatCapacityMax=listing["seatCapacity"]["maxSeats"],
        availabilityStatus=listing["availabilityStatus"],
        budgetBandId=listing["budgetBandId"],
        budgetDisplayText=listing["budgetDisplayText"],
        pricingMode=listing.get("pricingMode", "ON_ENQUIRY"),
        nearMetro=listing.get("nearMetro", False),
        metroNote=listing.get("metroNote"),
        parking=listing.get("parking", "NONE"),
        powerBackup=listing.get("powerBackup", False),
        gstInvoiceAvailable=listing.get("gstInvoiceAvailable", False),
        accessHours=listing["accessHours"],
        weekendAccess=listing.get("weekendAccess", False),
        amenities=listing.get("amenities", []),
        meetingRooms={
            "count": meeting_rooms["count"],
            "addonOnly": meeting_rooms.get("addonOnly", True)
        } if meeting_rooms else None,
        internetSpeedMbps=listing.get("internetSpeedMbps"),
        dealTags=listing.get("dealTags", []),
        dealDetails=listing.get("dealDetails"),
        dealEligibility=listing.get("dealEligibility"),
        overview=listing["overview"],
        houseRules=listing.get("houseRules"),
        isVerified=listing.get("verificationStatus") == "APPROVED_VERIFIED",
        verifiedAt=listing.get("publishedAt"),
        createdAt=listing["createdAt"]
    )


async def filter_listings(
    locality: Optional[str] = None,
    budget_band_id: Optional[str] = None,
    team_size_band: Optional[str] = None,
    space_type: Optional[str] = None,
    near_metro: Optional[bool] = None,
    parking: Optional[str] = None,
    power_backup: Optional[bool] = None,
    gst_invoice: Optional[bool] = None,
    sort: str = "best_match",
    page: int = 1,
    page_size: int = 20
) -> Tuple[List[Dict[str, Any]], int]:
    """Filter and sort listings."""
    db = get_database()
    
    # Build query - only show APPROVED_VERIFIED listings
    query: Dict[str, Any] = {"verificationStatus": "APPROVED_VERIFIED"}
    
    if locality:
        query["locality"] = locality
    
    if budget_band_id:
        query["budgetBandId"] = budget_band_id
    
    if space_type:
        query["workspaceTypes"] = {"$in": [space_type]}
    
    if near_metro is not None:
        query["nearMetro"] = near_metro
    
    if parking:
        query["parking"] = parking
    
    if power_backup is not None:
        query["powerBackup"] = power_backup
    
    if gst_invoice is not None:
        query["gstInvoiceAvailable"] = gst_invoice
    
    # Team size filter
    if team_size_band:
        # Parse team size band (e.g., "1-5", "6-15")
        min_seats, max_seats = parse_team_size_band(team_size_band)
        query["$or"] = [
            {
                "seatCapacity.minSeats": {"$lte": max_seats},
                "seatCapacity.maxSeats": {"$gte": min_seats}
            }
        ]
    
    # Count total
    total = await db.listings.count_documents(query)
    
    # Sort
    sort_key = get_sort_key(sort)
    
    # Paginate
    skip = (page - 1) * page_size
    cursor = db.listings.find(query).sort(sort_key).skip(skip).limit(page_size)
    listings = await cursor.to_list(length=page_size)
    
    return listings, total


def parse_team_size_band(band: str) -> Tuple[int, int]:
    """Parse team size band to min/max."""
    if band == "1-5":
        return (1, 5)
    elif band == "6-15":
        return (6, 15)
    elif band == "16-30":
        return (16, 30)
    elif band == "31-50":
        return (31, 50)
    elif band == "50+":
        return (50, 999)
    return (0, 999)


def get_sort_key(sort: str) -> List[tuple]:
    """Get MongoDB sort key."""
    if sort == "budget_low":
        # Sort by budget band order
        return [("budgetBandId", 1), ("createdAt", -1)]
    elif sort == "recent_verified":
        return [("publishedAt", -1), ("createdAt", -1)]
    else:  # best_match
        # Verified first, then available, then by date
        return [
            ("verificationStatus", 1),  # APPROVED_VERIFIED first
            ("availabilityStatus", 1),  # AVAILABLE first
            ("publishedAt", -1)
        ]
