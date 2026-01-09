"""Partner listings routes."""
from typing import List
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, Request
from app.core.security import require_partner
from app.core.image_compress import compress_image
from app.core.cloudinary import upload_image
from app.schemas.listing import (
    ListingCreateRequest,
    ListingUpdateRequest,
    PartnerListingResponse,
    ListingPhotoResponse
)
from app.services.listing_service import generate_slug, ensure_unique_slug
from app.core.errors import NotFoundError, ForbiddenError
from app.db.mongodb import get_database
from app.models.listing import WorkspaceListing, ListingPhoto, SeatCapacity, MeetingRooms
from bson import ObjectId
from datetime import datetime

router = APIRouter()


@router.get("/listings", response_model=List[PartnerListingResponse])
async def get_partner_listings(current_user: dict = Depends(require_partner)):
    """Get all listings for current partner."""
    db = get_database()
    partner_id = current_user["partnerId"]
    
    cursor = db.listings.find({"partnerId": ObjectId(partner_id)}).sort("createdAt", -1)
    listings = await cursor.to_list(length=100)
    
    return [
        PartnerListingResponse(
            listingId=str(l["_id"]),
            slug=l.get("slug"),
            partnerId=str(l["partnerId"]),
            displayName=l["displayName"],
            brandHidden=l.get("brandHidden", False),
            locality=l["locality"],
            city=l.get("city", "Delhi"),
            workspaceTypes=l["workspaceTypes"],
            photos=[
                ListingPhotoResponse(
                    url=photo["url"],
                    publicId=photo["publicId"],
                    width=photo["width"],
                    height=photo["height"],
                    bytes=photo["bytes"],
                    format=photo["format"],
                    tag=photo.get("tag")
                )
                for photo in l.get("photos", [])
            ],
            seatCapacityMin=l["seatCapacity"]["minSeats"],
            seatCapacityMax=l["seatCapacity"]["maxSeats"],
            availabilityStatus=l["availabilityStatus"],
            budgetBandId=l["budgetBandId"],
            budgetDisplayText=l["budgetDisplayText"],
            pricingMode=l.get("pricingMode", "ON_ENQUIRY"),
            nearMetro=l.get("nearMetro", False),
            metroNote=l.get("metroNote"),
            parking=l.get("parking", "NONE"),
            powerBackup=l.get("powerBackup", False),
            gstInvoiceAvailable=l.get("gstInvoiceAvailable", False),
            accessHours=l["accessHours"],
            weekendAccess=l.get("weekendAccess", False),
            amenities=l.get("amenities", []),
            meetingRooms={
                "count": l["meetingRooms"]["count"],
                "addonOnly": l["meetingRooms"].get("addonOnly", True)
            } if l.get("meetingRooms") else None,
            internetSpeedMbps=l.get("internetSpeedMbps"),
            dealTags=l.get("dealTags", []),
            dealDetails=l.get("dealDetails"),
            dealEligibility=l.get("dealEligibility"),
            overview=l["overview"],
            houseRules=l.get("houseRules"),
            verificationStatus=l.get("verificationStatus", "PENDING_REVIEW"),
            adminNotes=l.get("adminNotes"),
            createdAt=l["createdAt"],
            updatedAt=l["updatedAt"],
            publishedAt=l.get("publishedAt")
        )
        for l in listings
    ]


@router.post("/listings", response_model=PartnerListingResponse)
async def create_listing(
    listing: ListingCreateRequest,
    current_user: dict = Depends(require_partner)
):
    """Create a new listing (draft with PENDING_REVIEW status)."""
    db = get_database()
    partner_id = current_user["partnerId"]
    
    # Generate slug
    slug = generate_slug(listing.displayName, listing.locality)
    slug = await ensure_unique_slug(slug)
    
    now = datetime.utcnow()
    
    listing_doc = {
        "_id": ObjectId(),
        "slug": slug,
        "partnerId": ObjectId(partner_id),
        "displayName": listing.displayName,
        "brandHidden": listing.brandHidden,
        "locality": listing.locality,
        "city": "Delhi",
        "workspaceTypes": listing.workspaceTypes,
        "photos": [],
        "seatCapacity": {
            "minSeats": listing.seatCapacityMin,
            "maxSeats": listing.seatCapacityMax
        },
        "availabilityStatus": listing.availabilityStatus,
        "budgetBandId": listing.budgetBandId,
        "budgetDisplayText": listing.budgetDisplayText,
        "pricingMode": "ON_ENQUIRY",
        "nearMetro": listing.nearMetro,
        "metroNote": listing.metroNote,
        "parking": listing.parking,
        "powerBackup": listing.powerBackup,
        "gstInvoiceAvailable": listing.gstInvoiceAvailable,
        "accessHours": listing.accessHours,
        "weekendAccess": listing.weekendAccess,
        "amenities": listing.amenities,
        "meetingRooms": {
            "count": listing.meetingRoomsCount,
            "addonOnly": listing.meetingRoomsAddonOnly
        } if listing.meetingRoomsCount else None,
        "internetSpeedMbps": listing.internetSpeedMbps,
        "dealTags": listing.dealTags,
        "dealDetails": listing.dealDetails,
        "dealEligibility": listing.dealEligibility,
        "overview": listing.overview,
        "houseRules": listing.houseRules,
        "verificationStatus": "PENDING_REVIEW",
        "adminNotes": None,
        "publishedAt": None,
        "createdAt": now,
        "updatedAt": now
    }
    
    result = await db.listings.insert_one(listing_doc)
    listing_doc["_id"] = result.inserted_id
    
    # Create verification record
    from app.services.verification_service import get_or_create_verification
    await get_or_create_verification(str(listing_doc["_id"]))
    
    # Return response
    return PartnerListingResponse(
        listingId=str(listing_doc["_id"]),
        slug=listing_doc["slug"],
        partnerId=str(listing_doc["partnerId"]),
        displayName=listing_doc["displayName"],
        brandHidden=listing_doc["brandHidden"],
        locality=listing_doc["locality"],
        city=listing_doc["city"],
        workspaceTypes=listing_doc["workspaceTypes"],
        photos=[],
        seatCapacityMin=listing_doc["seatCapacity"]["minSeats"],
        seatCapacityMax=listing_doc["seatCapacity"]["maxSeats"],
        availabilityStatus=listing_doc["availabilityStatus"],
        budgetBandId=listing_doc["budgetBandId"],
        budgetDisplayText=listing_doc["budgetDisplayText"],
        pricingMode=listing_doc["pricingMode"],
        nearMetro=listing_doc["nearMetro"],
        metroNote=listing_doc["metroNote"],
        parking=listing_doc["parking"],
        powerBackup=listing_doc["powerBackup"],
        gstInvoiceAvailable=listing_doc["gstInvoiceAvailable"],
        accessHours=listing_doc["accessHours"],
        weekendAccess=listing_doc["weekendAccess"],
        amenities=listing_doc["amenities"],
        meetingRooms={
            "count": listing_doc["meetingRooms"]["count"],
            "addonOnly": listing_doc["meetingRooms"]["addonOnly"]
        } if listing_doc.get("meetingRooms") else None,
        internetSpeedMbps=listing_doc["internetSpeedMbps"],
        dealTags=listing_doc["dealTags"],
        dealDetails=listing_doc["dealDetails"],
        dealEligibility=listing_doc["dealEligibility"],
        overview=listing_doc["overview"],
        houseRules=listing_doc["houseRules"],
        verificationStatus=listing_doc["verificationStatus"],
        adminNotes=listing_doc["adminNotes"],
        createdAt=listing_doc["createdAt"],
        updatedAt=listing_doc["updatedAt"],
        publishedAt=listing_doc["publishedAt"]
    )


@router.get("/listings/{listing_id}", response_model=PartnerListingResponse)
async def get_partner_listing(
    listing_id: str,
    current_user: dict = Depends(require_partner)
):
    """Get a listing by ID (only own listings)."""
    db = get_database()
    partner_id = current_user["partnerId"]
    
    listing = await db.listings.find_one({
        "_id": ObjectId(listing_id),
        "partnerId": ObjectId(partner_id)
    })
    
    if not listing:
        raise NotFoundError("Listing", listing_id)
    
    return PartnerListingResponse(
        listingId=str(listing["_id"]),
        slug=listing.get("slug"),
        partnerId=str(listing["partnerId"]),
        displayName=listing["displayName"],
        brandHidden=listing.get("brandHidden", False),
        locality=listing["locality"],
        city=listing.get("city", "Delhi"),
        workspaceTypes=listing["workspaceTypes"],
        photos=[
            ListingPhotoResponse(
                url=photo["url"],
                publicId=photo["publicId"],
                width=photo["width"],
                height=photo["height"],
                bytes=photo["bytes"],
                format=photo["format"],
                tag=photo.get("tag")
            )
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
            "count": listing["meetingRooms"]["count"],
            "addonOnly": listing["meetingRooms"].get("addonOnly", True)
        } if listing.get("meetingRooms") else None,
        internetSpeedMbps=listing.get("internetSpeedMbps"),
        dealTags=listing.get("dealTags", []),
        dealDetails=listing.get("dealDetails"),
        dealEligibility=listing.get("dealEligibility"),
        overview=listing["overview"],
        houseRules=listing.get("houseRules"),
        verificationStatus=listing.get("verificationStatus", "PENDING_REVIEW"),
        adminNotes=listing.get("adminNotes"),
        createdAt=listing["createdAt"],
        updatedAt=listing["updatedAt"],
        publishedAt=listing.get("publishedAt")
    )


@router.put("/listings/{listing_id}", response_model=PartnerListingResponse)
async def update_partner_listing(
    listing_id: str,
    updates: ListingUpdateRequest,
    current_user: dict = Depends(require_partner)
):
    """Update a listing (editable if not approved; if NEEDS_INFO, allow edit and resubmit -> PENDING_REVIEW)."""
    db = get_database()
    partner_id = current_user["partnerId"]
    
    listing = await db.listings.find_one({
        "_id": ObjectId(listing_id),
        "partnerId": ObjectId(partner_id)
    })
    
    if not listing:
        raise NotFoundError("Listing", listing_id)
    
    # Check if editable
    verification_status = listing.get("verificationStatus", "PENDING_REVIEW")
    if verification_status == "APPROVED_VERIFIED":
        raise ForbiddenError("Cannot edit approved listing")
    
    # Build update dict
    update_dict = {"updatedAt": datetime.utcnow()}
    
    if updates.displayName is not None:
        update_dict["displayName"] = updates.displayName
    if updates.brandHidden is not None:
        update_dict["brandHidden"] = updates.brandHidden
    if updates.locality is not None:
        update_dict["locality"] = updates.locality
    if updates.workspaceTypes is not None:
        update_dict["workspaceTypes"] = updates.workspaceTypes
    if updates.seatCapacityMin is not None or updates.seatCapacityMax is not None:
        seat_capacity = listing["seatCapacity"].copy()
        if updates.seatCapacityMin is not None:
            seat_capacity["minSeats"] = updates.seatCapacityMin
        if updates.seatCapacityMax is not None:
            seat_capacity["maxSeats"] = updates.seatCapacityMax
        update_dict["seatCapacity"] = seat_capacity
    if updates.availabilityStatus is not None:
        update_dict["availabilityStatus"] = updates.availabilityStatus
    if updates.budgetBandId is not None:
        update_dict["budgetBandId"] = updates.budgetBandId
    if updates.budgetDisplayText is not None:
        update_dict["budgetDisplayText"] = updates.budgetDisplayText
    if updates.nearMetro is not None:
        update_dict["nearMetro"] = updates.nearMetro
    if updates.metroNote is not None:
        update_dict["metroNote"] = updates.metroNote
    if updates.parking is not None:
        update_dict["parking"] = updates.parking
    if updates.powerBackup is not None:
        update_dict["powerBackup"] = updates.powerBackup
    if updates.gstInvoiceAvailable is not None:
        update_dict["gstInvoiceAvailable"] = updates.gstInvoiceAvailable
    if updates.accessHours is not None:
        update_dict["accessHours"] = updates.accessHours
    if updates.weekendAccess is not None:
        update_dict["weekendAccess"] = updates.weekendAccess
    if updates.amenities is not None:
        update_dict["amenities"] = updates.amenities
    if updates.meetingRoomsCount is not None or updates.meetingRoomsAddonOnly is not None:
        meeting_rooms = listing.get("meetingRooms", {}) if listing.get("meetingRooms") else {}
        if updates.meetingRoomsCount is not None:
            meeting_rooms["count"] = updates.meetingRoomsCount
        if updates.meetingRoomsAddonOnly is not None:
            meeting_rooms["addonOnly"] = updates.meetingRoomsAddonOnly
        update_dict["meetingRooms"] = meeting_rooms
    if updates.internetSpeedMbps is not None:
        update_dict["internetSpeedMbps"] = updates.internetSpeedMbps
    if updates.dealTags is not None:
        update_dict["dealTags"] = updates.dealTags
    if updates.dealDetails is not None:
        update_dict["dealDetails"] = updates.dealDetails
    if updates.dealEligibility is not None:
        update_dict["dealEligibility"] = updates.dealEligibility
    if updates.overview is not None:
        update_dict["overview"] = updates.overview
    if updates.houseRules is not None:
        update_dict["houseRules"] = updates.houseRules
    
    # If NEEDS_INFO, resubmit -> PENDING_REVIEW
    if verification_status == "NEEDS_INFO":
        update_dict["verificationStatus"] = "PENDING_REVIEW"
        update_dict["adminNotes"] = None
    
    result = await db.listings.find_one_and_update(
        {"_id": ObjectId(listing_id)},
        {"$set": update_dict},
        return_document=True
    )
    
    # Return updated listing (similar to get_partner_listing)
    return PartnerListingResponse(
        listingId=str(result["_id"]),
        slug=result.get("slug"),
        partnerId=str(result["partnerId"]),
        displayName=result["displayName"],
        brandHidden=result.get("brandHidden", False),
        locality=result["locality"],
        city=result.get("city", "Delhi"),
        workspaceTypes=result["workspaceTypes"],
        photos=[
            ListingPhotoResponse(
                url=photo["url"],
                publicId=photo["publicId"],
                width=photo["width"],
                height=photo["height"],
                bytes=photo["bytes"],
                format=photo["format"],
                tag=photo.get("tag")
            )
            for photo in result.get("photos", [])
        ],
        seatCapacityMin=result["seatCapacity"]["minSeats"],
        seatCapacityMax=result["seatCapacity"]["maxSeats"],
        availabilityStatus=result["availabilityStatus"],
        budgetBandId=result["budgetBandId"],
        budgetDisplayText=result["budgetDisplayText"],
        pricingMode=result.get("pricingMode", "ON_ENQUIRY"),
        nearMetro=result.get("nearMetro", False),
        metroNote=result.get("metroNote"),
        parking=result.get("parking", "NONE"),
        powerBackup=result.get("powerBackup", False),
        gstInvoiceAvailable=result.get("gstInvoiceAvailable", False),
        accessHours=result["accessHours"],
        weekendAccess=result.get("weekendAccess", False),
        amenities=result.get("amenities", []),
        meetingRooms={
            "count": result["meetingRooms"]["count"],
            "addonOnly": result["meetingRooms"].get("addonOnly", True)
        } if result.get("meetingRooms") else None,
        internetSpeedMbps=result.get("internetSpeedMbps"),
        dealTags=result.get("dealTags", []),
        dealDetails=result.get("dealDetails"),
        dealEligibility=result.get("dealEligibility"),
        overview=result["overview"],
        houseRules=result.get("houseRules"),
        verificationStatus=result.get("verificationStatus", "PENDING_REVIEW"),
        adminNotes=result.get("adminNotes"),
        createdAt=result["createdAt"],
        updatedAt=result["updatedAt"],
        publishedAt=result.get("publishedAt")
    )


@router.post("/listings/{listing_id}/photos", response_model=List[ListingPhotoResponse])
async def upload_listing_photo(
    listing_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_partner)
):
    """Upload a photo for a listing (compresses server-side first, then uploads to Cloudinary)."""
    db = get_database()
    partner_id = current_user["partnerId"]
    
    # Verify listing belongs to partner
    listing = await db.listings.find_one({
        "_id": ObjectId(listing_id),
        "partnerId": ObjectId(partner_id)
    })
    
    if not listing:
        raise NotFoundError("Listing", listing_id)
    
    # Compress image (MANDATORY)
    compressed_bytes, format_name, width, height, byte_size = await compress_image(file)
    
    # Upload to Cloudinary
    from app.core.config import get_settings
    settings = get_settings()
    folder_path = f"{settings.CLOUDINARY_FOLDER}/{partner_id}/{listing_id}"
    
    upload_result = await upload_image(compressed_bytes, folder_path)
    
    # Add photo to listing
    photo = {
        "url": upload_result["secure_url"],
        "publicId": upload_result["public_id"],
        "width": upload_result["width"],
        "height": upload_result["height"],
        "bytes": upload_result["bytes"],
        "format": upload_result["format"],
        "tag": None
    }
    
    await db.listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$push": {"photos": photo}, "$set": {"updatedAt": datetime.utcnow()}}
    )
    
    # Return updated photos list
    updated_listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
    return [
        ListingPhotoResponse(
            url=p["url"],
            publicId=p["publicId"],
            width=p["width"],
            height=p["height"],
            bytes=p["bytes"],
            format=p["format"],
            tag=p.get("tag")
        )
        for p in updated_listing.get("photos", [])
    ]


@router.delete("/listings/{listing_id}/photos/{public_id}")
async def delete_listing_photo(
    listing_id: str,
    public_id: str,
    current_user: dict = Depends(require_partner)
):
    """Delete a photo from a listing."""
    db = get_database()
    partner_id = current_user["partnerId"]
    
    # Verify listing belongs to partner
    listing = await db.listings.find_one({
        "_id": ObjectId(listing_id),
        "partnerId": ObjectId(partner_id)
    })
    
    if not listing:
        raise NotFoundError("Listing", listing_id)
    
    # Remove photo from listing
    await db.listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$pull": {"photos": {"publicId": public_id}}, "$set": {"updatedAt": datetime.utcnow()}}
    )
    
    # Delete from Cloudinary
    from app.core.cloudinary import delete_image
    await delete_image(public_id)
    
    return {"ok": True}
