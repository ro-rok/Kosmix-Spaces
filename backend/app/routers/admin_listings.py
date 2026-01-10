"""Admin listings and verification routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.security import require_admin
from app.schemas.listing import (
    AdminListingResponse,
    VerificationUpdateRequest,
    ApproveListingRequest,
    NeedsInfoRequest,
    RejectListingRequest,
    ListingPhotoResponse
)
from app.services.verification_service import (
    get_or_create_verification,
    update_verification,
    approve_listing,
    set_needs_info,
    reject_listing
)
from app.core.errors import NotFoundError
from app.db.mongodb import get_database
from bson import ObjectId

router = APIRouter()


@router.get("/listings", response_model=List[AdminListingResponse])
async def get_admin_listings(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """Get listings with filters (admin view)."""
    db = get_database()
    
    query = {}
    if status:
        query["verificationStatus"] = status
    
    total = await db.listings.count_documents(query)
    skip = (page - 1) * pageSize
    
    cursor = db.listings.find(query).sort("createdAt", -1).skip(skip).limit(pageSize)
    listings = await cursor.to_list(length=pageSize)
    
    # Get verification data for each listing
    result = []
    for listing in listings:
        verification = await get_or_create_verification(str(listing["_id"]))
        
        result.append(AdminListingResponse(
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
            publishedAt=listing.get("publishedAt"),
            verificationChecks=verification.get("checks")
        ))
    
    return result


@router.get("/listings/{listing_id}", response_model=AdminListingResponse)
async def get_admin_listing(
    listing_id: str,
    current_user: dict = Depends(require_admin)
):
    """Get a listing by ID (admin view)."""
    db = get_database()
    
    # Try to find by ObjectId first, then by slug
    listing = None
    try:
        # Try as ObjectId first
        listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
    except:
        # If ObjectId fails, try as slug
        listing = await db.listings.find_one({"slug": listing_id})
    
    if not listing:
        raise NotFoundError("Listing", listing_id)
    
    verification = await get_or_create_verification(str(listing["_id"]))
    
    return AdminListingResponse(
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
        publishedAt=listing.get("publishedAt"),
        verificationChecks=verification.get("checks")
    )


@router.patch("/listings/{listing_id}/verification")
async def update_listing_verification(
    listing_id: str,
    verification_update: VerificationUpdateRequest,
    current_user: dict = Depends(require_admin)
):
    """Update verification checks and notes."""
    await update_verification(
        listing_id,
        checks=verification_update.checks,
        notes=verification_update.notes
    )
    
    return {"ok": True}


@router.post("/listings/{listing_id}/approve")
async def approve_listing_route(
    listing_id: str,
    request: ApproveListingRequest,
    current_user: dict = Depends(require_admin)
):
    """Approve a listing (sets APPROVED_VERIFIED + publishedAt)."""
    admin_id = current_user["adminId"]
    await approve_listing(listing_id, admin_id, request.notes)
    
    return {"ok": True, "message": "Listing approved and published"}


@router.post("/listings/{listing_id}/needs-info")
async def needs_info_listing(
    listing_id: str,
    request: NeedsInfoRequest,
    current_user: dict = Depends(require_admin)
):
    """Set listing to NEEDS_INFO (requires notes)."""
    admin_id = current_user["adminId"]
    await set_needs_info(listing_id, admin_id, request.notes)
    
    return {"ok": True, "message": "Listing marked as needs info"}


@router.post("/listings/{listing_id}/reject")
async def reject_listing_route(
    listing_id: str,
    request: RejectListingRequest,
    current_user: dict = Depends(require_admin)
):
    """Reject a listing (requires reason)."""
    admin_id = current_user["adminId"]
    await reject_listing(listing_id, admin_id, request.reason)
    
    return {"ok": True, "message": "Listing rejected"}
