"""Premium listing management service."""
from datetime import datetime
from typing import List, Optional, Dict, Any
from bson import ObjectId
from app.db.mongodb import get_database
from app.models.premium_listing import (
    PremiumWorkspaceListing,
    PremiumOffering,
    OfferingType,
    SlugData,
    LocationData,
    ListingSubmissionValidation,
    OfferingPhoto,
    HeroPhoto
)
from app.services.slug_service import ensure_unique_slug, find_listing_by_slug
from app.core.errors import NotFoundError, ValidationError


async def create_premium_listing(partner_id: str, listing_data: dict) -> dict:
    """Create a new premium listing."""
    db = get_database()
    
    # Get partner info for slug generation
    partner = await db.partners.find_one({"_id": ObjectId(partner_id)})
    if not partner:
        raise NotFoundError("Partner", partner_id)
    
    # Generate unique slug
    slug_data = await ensure_unique_slug(
        partner["workspaceBrandName"],
        listing_data["locality"],
        listing_data["displayName"],
        str(ObjectId())  # Generate new ObjectId for slug collision check
    )
    
    # Create location data with privacy protection
    location_data = LocationData(
        locality=listing_data["locality"],
        city=listing_data.get("city", "Delhi"),
        exactAddress=listing_data.get("exactAddress"),  # Internal only
        nearMetro=listing_data.get("nearMetro", False),
        metroNote=listing_data.get("metroNote"),
        accessHours=listing_data.get("accessHours", "9 AM - 9 PM"),
        weekendAccess=listing_data.get("weekendAccess", False)
    )
    
    # Initialize all offering types
    offerings = {}
    offering_types: List[OfferingType] = [
        "private-offices",
        "dedicated-desks", 
        "hot-desks",
        "meeting-rooms",
        "event-spaces"
    ]
    
    for offering_type in offering_types:
        offerings[offering_type] = PremiumOffering(
            type=offering_type,
            title=_get_default_offering_title(offering_type),
            enabled=False
        )
    
    # Create listing document
    listing_doc = {
        "_id": ObjectId(),
        "partnerId": ObjectId(partner_id),
        "displayName": listing_data["displayName"],
        "overview": listing_data["overview"],
        "slugData": slug_data,
        "location": location_data.model_dump(),
        "offerings": {k: v.model_dump() for k, v in offerings.items()},
        "heroPhotos": [],
        "amenities": listing_data.get("amenities", []),
        "highlights": listing_data.get("highlights", []),
        "verificationStatus": "PENDING",
        "isPublished": False,
        "viewCount": 0,
        "enquiryCount": 0,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    # Insert into database
    result = await db.premium_listings.insert_one(listing_doc)
    listing_doc["_id"] = result.inserted_id
    
    return listing_doc


async def get_premium_listing(listing_id: str, partner_id: Optional[str] = None) -> dict:
    """Get premium listing by ID."""
    db = get_database()
    
    # First check if listing exists at all
    listing = await db.premium_listings.find_one({"_id": ObjectId(listing_id)})
    if not listing:
        raise NotFoundError("Listing", listing_id)
    
    # If partner_id provided, verify ownership
    if partner_id:
        if str(listing["partnerId"]) != partner_id:
            # Log for debugging
            print(f"DEBUG: Partner ID mismatch - listing partnerId: {listing['partnerId']}, requested partnerId: {partner_id}")
            raise NotFoundError("Listing", listing_id)
    
    return listing


async def get_premium_listing_by_slug(slug: str) -> dict:
    """Get premium listing by slug."""
    listing = await find_listing_by_slug(slug)
    if not listing:
        raise NotFoundError("Listing", slug)
    
    return listing


async def update_premium_listing(listing_id: str, partner_id: str, update_data: dict) -> dict:
    """Update premium listing."""
    db = get_database()
    
    # Get existing listing
    listing = await get_premium_listing(listing_id, partner_id)
    
    # Prepare update document
    update_doc = {"updatedAt": datetime.utcnow()}
    
    # Handle basic info updates
    if "displayName" in update_data:
        update_doc["displayName"] = update_data["displayName"]
    
    if "overview" in update_data:
        update_doc["overview"] = update_data["overview"]
    
    # Handle location updates
    location_fields = [
        "locality", "city", "exactAddress", "nearMetro", "metroNote", "metroDetails",
        "accessHours", "customAccessHours", "weekendAccess", "twentyFourSevenAccess",
        "parking", "parkingNotes", "powerBackup", "internetSpeedMbps", "wifiDetails",
        "houseRules", "specialInstructions", "approximateCoordinates"
    ]
    location_updated = False
    
    for field in location_fields:
        if field in update_data:
            update_doc[f"location.{field}"] = update_data[field]
            location_updated = True
    
    # Handle other fields
    if "amenities" in update_data:
        update_doc["amenities"] = update_data["amenities"]
    
    if "highlights" in update_data:
        update_doc["highlights"] = update_data["highlights"]
    
    # Update slug if basic info changed
    if any(field in update_data for field in ["displayName", "locality"]):
        partner = await db.partners.find_one({"_id": ObjectId(partner_id)})
        new_slug_data = await ensure_unique_slug(
            partner["workspaceBrandName"],
            update_data.get("locality", listing["location"]["locality"]),
            update_data.get("displayName", listing["displayName"]),
            listing_id
        )
        update_doc["slugData"] = new_slug_data
    
    # Apply updates
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": update_doc}
    )
    
    # Regenerate SEO metadata if content changed (displayName, overview, locality, amenities affect SEO)
    seo_relevant_fields = ["displayName", "overview", "locality", "amenities", "heroPhotos"]
    if any(field in update_data for field in seo_relevant_fields):
        try:
            from app.services.seo_service import update_listing_seo
            await update_listing_seo(listing_id)
        except Exception as e:
            # Don't fail the update if SEO generation fails
            print(f"Warning: Failed to regenerate SEO metadata: {e}")
    
    # Return updated listing
    return await get_premium_listing(listing_id, partner_id)


async def update_offering(listing_id: str, partner_id: str, offering_type: OfferingType, offering_data: dict) -> dict:
    """Update a specific offering."""
    db = get_database()
    
    # Verify listing exists and belongs to partner
    await get_premium_listing(listing_id, partner_id)
    
    # Prepare offering update
    update_doc = {"updatedAt": datetime.utcnow()}
    
    # Update offering fields
    offering_fields = ["title", "description", "features", "enabled", "startingPrice", "unit", "budgetBand", "capacity", "availability"]
    
    for field in offering_fields:
        if field in offering_data:
            update_doc[f"offerings.{offering_type}.{field}"] = offering_data[field]
    
    # Apply update
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": update_doc}
    )
    
    return await get_premium_listing(listing_id, partner_id)


async def add_offering_photo(listing_id: str, partner_id: str, offering_type: OfferingType, photo_data: dict) -> dict:
    """Add photo to specific offering."""
    db = get_database()
    
    # Verify listing exists and belongs to partner
    listing = await get_premium_listing(listing_id, partner_id)
    
    # Create photo document with compression metadata
    photo = OfferingPhoto(
        url=photo_data["url"],
        publicId=photo_data["publicId"],
        width=photo_data["width"],
        height=photo_data["height"],
        bytes=photo_data["bytes"],
        format=photo_data["format"],
        offeringType=offering_type,
        order=len(listing["offerings"][offering_type]["photos"]),
        # Add compression metadata if available
        compressionRatio=photo_data.get("compression", {}).get("total_compression_ratio", 0),
        originalSize=photo_data.get("compression", {}).get("original_size"),
        variants=photo_data.get("variants", {})
    )
    
    # Add photo to offering
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {
            "$push": {f"offerings.{offering_type}.photos": photo.model_dump()},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )
    
    return photo.model_dump()


async def add_hero_photo(listing_id: str, partner_id: str, photo_data: dict) -> dict:
    """Add hero photo to listing."""
    db = get_database()
    
    # Verify listing exists and belongs to partner
    listing = await get_premium_listing(listing_id, partner_id)
    
    # Create hero photo document with compression metadata
    photo = HeroPhoto(
        url=photo_data["url"],
        publicId=photo_data["publicId"],
        width=photo_data["width"],
        height=photo_data["height"],
        bytes=photo_data["bytes"],
        format=photo_data["format"],
        order=len(listing.get("heroPhotos", [])),
        # Add compression metadata if available
        compressionRatio=photo_data.get("compression", {}).get("total_compression_ratio", 0),
        originalSize=photo_data.get("compression", {}).get("original_size"),
        variants=photo_data.get("variants", {})
    )
    
    # Add photo to hero photos array
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {
            "$push": {"heroPhotos": photo.model_dump()},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )
    
    return photo.model_dump()


async def remove_offering_photo(listing_id: str, partner_id: str, offering_type: OfferingType, public_id: str) -> bool:
    """Remove photo from specific offering."""
    db = get_database()
    
    # Verify listing exists and belongs to partner
    await get_premium_listing(listing_id, partner_id)
    
    # Remove photo
    result = await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {
            "$pull": {f"offerings.{offering_type}.photos": {"publicId": public_id}},
            "$set": {"updatedAt": datetime.utcnow()}
        }
    )
    
    return result.modified_count > 0


async def reorder_offering_photos(listing_id: str, partner_id: str, offering_type: OfferingType, photo_order: List[str]) -> dict:
    """Reorder photos within an offering."""
    db = get_database()
    
    # Get listing
    listing = await get_premium_listing(listing_id, partner_id)
    
    # Get current photos
    current_photos = listing["offerings"][offering_type]["photos"]
    
    # Create photo lookup
    photo_lookup = {photo["publicId"]: photo for photo in current_photos}
    
    # Reorder photos
    reordered_photos = []
    for i, public_id in enumerate(photo_order):
        if public_id in photo_lookup:
            photo = photo_lookup[public_id].copy()
            photo["order"] = i
            reordered_photos.append(photo)
    
    # Update database
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {
            "$set": {
                f"offerings.{offering_type}.photos": reordered_photos,
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    return await get_premium_listing(listing_id, partner_id)


async def validate_listing_for_submission(listing_id: str, partner_id: str) -> ListingSubmissionValidation:
    """Validate listing is ready for submission."""
    listing = await get_premium_listing(listing_id, partner_id)
    validation = ListingSubmissionValidation(isValid=True)
    
    print(f"DEBUG: Validating listing {listing_id}")
    
    # Check basic info
    if not listing.get("displayName", "").strip():
        validation.add_error("Display name is required")
        print("DEBUG: Display name validation failed")
    else:
        print(f"DEBUG: Display name OK: {listing.get('displayName')}")
    
    if not listing.get("overview", "").strip() or len(listing["overview"]) < 10:
        validation.add_error("Overview must be at least 10 characters")
        print(f"DEBUG: Overview validation failed, length: {len(listing.get('overview', ''))}")
    else:
        print(f"DEBUG: Overview OK, length: {len(listing['overview'])}")
    
    # Check location
    location = listing.get("location", {})
    if not location.get("locality"):
        validation.add_error("Locality is required")
        print("DEBUG: Locality validation failed")
    else:
        print(f"DEBUG: Locality OK: {location.get('locality')}")
    
    # Check offerings - at least one must be enabled with photos
    offerings = listing.get("offerings", {})
    enabled_offerings = 0
    offerings_with_photos = 0
    
    print(f"DEBUG: Checking offerings: {list(offerings.keys())}")
    
    for offering_type, offering in offerings.items():
        if offering.get("enabled"):
            enabled_offerings += 1
            print(f"DEBUG: {offering_type} is enabled")
            
            # Check for photos
            photos = offering.get("photos", [])
            print(f"DEBUG: {offering_type} has {len(photos)} photos")
            if len(photos) >= 1:
                offerings_with_photos += 1
                print(f"DEBUG: {offering_type} photos OK")
            else:
                validation.add_error(f"{offering.get('title', offering_type)} must have at least 1 photo")
                print(f"DEBUG: {offering_type} photos validation failed")
        else:
            print(f"DEBUG: {offering_type} is disabled")
    
    print(f"DEBUG: Total enabled offerings: {enabled_offerings}")
    print(f"DEBUG: Offerings with photos: {offerings_with_photos}")
    
    if enabled_offerings == 0:
        validation.add_error("At least one offering must be enabled")
        print("DEBUG: No enabled offerings")
    
    # Check amenities
    amenities = listing.get("amenities", [])
    print(f"DEBUG: Amenities: {amenities}")
    if len(amenities) == 0:
        validation.add_warning("Consider adding amenities to make listing more attractive")
    
    print(f"DEBUG: Validation result - isValid: {validation.isValid}, errors: {validation.errors}")
    return validation


async def submit_listing_for_review(listing_id: str, partner_id: str) -> dict:
    """Submit listing for admin review."""
    db = get_database()
    
    # Validate listing
    validation = await validate_listing_for_submission(listing_id, partner_id)
    if not validation.isValid:
        raise ValidationError("Listing validation failed", {"errors": validation.errors})
    
    # Update status
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {
            "$set": {
                "verificationStatus": "PENDING_REVIEW",
                "updatedAt": datetime.utcnow()
            }
        }
    )
    
    return await get_premium_listing(listing_id, partner_id)


async def get_partner_listings(partner_id: str, page: int = 1, page_size: int = 20) -> tuple[List[dict], int]:
    """Get all listings for a partner."""
    db = get_database()
    
    skip = (page - 1) * page_size
    
    # Get listings
    cursor = db.premium_listings.find(
        {"partnerId": ObjectId(partner_id)}
    ).sort("updatedAt", -1).skip(skip).limit(page_size)
    
    listings = await cursor.to_list(length=page_size)
    
    # Get total count
    total = await db.premium_listings.count_documents({"partnerId": ObjectId(partner_id)})
    
    return listings, total


async def increment_listing_view(listing_id: str) -> None:
    """Increment view count for a listing."""
    db = get_database()
    
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {
            "$inc": {"viewCount": 1},
            "$set": {"lastViewedAt": datetime.utcnow()}
        }
    )


async def increment_listing_enquiry(listing_id: str) -> None:
    """Increment enquiry count for a listing."""
    db = get_database()
    
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$inc": {"enquiryCount": 1}}
    )


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


def listing_to_public_response(listing: dict, enquiry_created: bool = False) -> dict:
    """Convert internal listing to public API response."""
    # Handle missing slugData for legacy listings
    slug_data = listing.get("slugData", {})
    slug = slug_data.get("slug") if slug_data else None
    
    # Fallback slug generation for legacy listings without slugData
    if not slug:
        # Generate a basic slug from displayName and locality
        display_name = listing.get("displayName", "")
        locality = listing.get("location", {}).get("locality", "")
        slug = f"{display_name}-{locality}".lower().replace(" ", "-")
    
    # Get location data safely
    location = listing.get("location", {})
    
    # Remove internal fields
    public_listing = {
        "listingId": str(listing["_id"]),
        "slug": slug,
        "displayName": listing.get("displayName", ""),
        "overview": listing.get("overview", ""),
        "locality": location.get("locality", ""),
        "city": location.get("city", "Delhi"),
        "nearMetro": location.get("nearMetro", False),
        "metroNote": location.get("metroNote"),
        "metroDetails": location.get("metroDetails"),
        "accessHours": location.get("accessHours", "9 AM - 9 PM"),
        "weekendAccess": location.get("weekendAccess", False),
        "twentyFourSevenAccess": location.get("twentyFourSevenAccess", False),
        "parking": location.get("parking", "NONE"),
        "parkingNotes": location.get("parkingNotes"),
        "powerBackup": location.get("powerBackup", False),
        "internetSpeedMbps": location.get("internetSpeedMbps"),
        "wifiDetails": location.get("wifiDetails"),
        "houseRules": location.get("houseRules"),
        "specialInstructions": location.get("specialInstructions"),
        "amenities": listing.get("amenities", []),
        "highlights": listing.get("highlights", []),
        "offerings": {},
        "heroPhotos": listing.get("heroPhotos", []),
        "verificationStatus": listing.get("verificationStatus", "PENDING"),
        "isPublished": listing.get("isPublished", False),
        "viewCount": listing.get("viewCount", 0),
        "status": listing.get("verificationStatus", "PENDING").lower(),  # For frontend compatibility
        "adminNotes": listing.get("adminNotes"),  # Include admin notes for partners
        "createdAt": listing["createdAt"].isoformat() if listing.get("createdAt") else None,
        "updatedAt": listing["updatedAt"].isoformat() if listing.get("updatedAt") else None
    }
    
    # Process offerings (remove internal data)
    for offering_type, offering in listing.get("offerings", {}).items():
        public_listing["offerings"][offering_type] = {
            "type": offering.get("type", offering_type),
            "title": offering.get("title", ""),
            "description": offering.get("description", ""),
            "features": offering.get("features", []),
            "enabled": offering.get("enabled", False),
            "startingPrice": offering.get("startingPrice"),
            "unit": offering.get("unit"),
            "budgetBand": offering.get("budgetBand"),
            "photos": offering.get("photos", []),
            "capacity": offering.get("capacity"),
            "availability": offering.get("availability")
        }
    
    # Location privacy: only reveal exact address if enquiry was created
    if enquiry_created:
        # Reveal exact address after enquiry
        if location.get("exactAddress"):
            public_listing["exactAddress"] = location["exactAddress"]
        # Keep approximate coordinates for map display
        if location.get("approximateCoordinates"):
            public_listing["approximateCoordinates"] = location["approximateCoordinates"]
    else:
        # Privacy mode: only show locality and approximate coordinates
        public_listing["exactAddress"] = None
        # Add approximate coordinates if available (privacy-protected)
        if location.get("approximateCoordinates"):
            public_listing["approximateCoordinates"] = location["approximateCoordinates"]
    
    # Add SEO metadata if available
    if listing.get("seoMetadata"):
        public_listing["seoMetadata"] = listing["seoMetadata"]
    
    # Add derived fields for frontend compatibility
    # Derive workspaceTypes from enabled offerings
    enabled_offerings = [
        offering_type for offering_type, offering in listing.get("offerings", {}).items()
        if offering.get("enabled", False)
    ]
    public_listing["workspaceTypes"] = enabled_offerings
    
    # Derive budget band from lowest priced enabled offering
    budget_bands = []
    min_price = None
    for offering in listing.get("offerings", {}).values():
        if offering.get("enabled", False) and offering.get("budgetBand"):
            budget_bands.append(offering["budgetBand"])
        if offering.get("enabled", False) and offering.get("startingPrice"):
            if min_price is None or offering["startingPrice"] < min_price:
                min_price = offering["startingPrice"]
    
    if budget_bands:
        # Use the most common budget band, or the first one
        public_listing["budgetBand"] = budget_bands[0]
    elif min_price:
        # Derive budget band from price
        if min_price < 10000:
            public_listing["budgetBand"] = "₹"
        elif min_price < 25000:
            public_listing["budgetBand"] = "₹₹"
        else:
            public_listing["budgetBand"] = "₹₹₹"
    
    # Derive seat capacity from offerings
    min_seats = None
    max_seats = None
    for offering in listing.get("offerings", {}).values():
        if offering.get("enabled", False) and offering.get("capacity"):
            capacity = offering["capacity"]
            if isinstance(capacity, dict):
                if capacity.get("minSeats") is not None:
                    if min_seats is None or capacity["minSeats"] < min_seats:
                        min_seats = capacity["minSeats"]
                if capacity.get("maxSeats") is not None:
                    if max_seats is None or capacity["maxSeats"] > max_seats:
                        max_seats = capacity["maxSeats"]
    
    public_listing["seatCapacityMin"] = min_seats or 1
    public_listing["seatCapacityMax"] = max_seats or min_seats or 10
    
    # Set availability status from listing or default to available
    public_listing["availabilityStatus"] = listing.get("availabilityStatus", "available")
    
    # Set default values for missing fields
    public_listing["dealTags"] = []
    public_listing["pricingMode"] = "on-enquiry"
    public_listing["gstInvoiceAvailable"] = True  # Assume premium listings provide GST
    public_listing["meetingRoomsAddon"] = any(
        offering.get("enabled", False) for offering_type, offering in listing.get("offerings", {}).items()
        if offering_type == "meeting-rooms"
    )
    
    return public_listing