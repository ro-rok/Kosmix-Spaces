"""Premium listing management routes."""
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.security import require_partner
from app.models.premium_listing import (
    PremiumListingCreate,
    PremiumListingUpdate,
    OfferingUpdateRequest,
    OfferingType,
    PhotoUploadResponse,
    TempPhotoUploadResponse
)
from app.services.premium_listing_service import (
    create_premium_listing,
    get_premium_listing,
    get_premium_listing_by_slug,
    update_premium_listing,
    update_offering,
    add_offering_photo,
    add_hero_photo,
    remove_offering_photo,
    reorder_offering_photos,
    validate_listing_for_submission,
    submit_listing_for_review,
    get_partner_listings,
    increment_listing_view,
    listing_to_public_response
)
from app.services.cloudinary_service import (
    upload_image, 
    delete_image, 
    upload_offering_photo,
    upload_hero_photo,
    validate_image_file,
    get_compression_stats,
    upload_temporary_photo
)
from app.core.errors import ValidationError, NotFoundError

router = APIRouter()


@router.post("/listings", response_model=dict)
async def create_listing(
    listing_data: PremiumListingCreate,
    current_user: dict = Depends(require_partner)
):
    """Create a new premium listing."""
    partner_id = current_user["partnerId"]
    
    listing = await create_premium_listing(
        partner_id=partner_id,
        listing_data=listing_data.model_dump()
    )
    
    return listing_to_public_response(listing)


@router.get("/listings", response_model=dict)
async def get_partner_listings_endpoint(
    page: int = 1,
    pageSize: int = 20,
    current_user: dict = Depends(require_partner)
):
    """Get all listings for current partner."""
    partner_id = current_user["partnerId"]
    
    listings, total = await get_partner_listings(
        partner_id=partner_id,
        page=page,
        page_size=min(pageSize, 100)  # Cap at 100
    )
    
    return {
        "items": [listing_to_public_response(listing) for listing in listings],
        "total": total,
        "page": page,
        "pageSize": pageSize
    }


@router.get("/listings/{listing_id}", response_model=dict)
async def get_listing(
    listing_id: str,
    current_user: dict = Depends(require_partner)
):
    """Get listing by ID (partner's own listings only)."""
    partner_id = current_user["partnerId"]
    
    listing = await get_premium_listing(listing_id, partner_id)
    return listing_to_public_response(listing)


@router.put("/listings/{listing_id}", response_model=dict)
async def update_listing(
    listing_id: str,
    update_data: PremiumListingUpdate,
    current_user: dict = Depends(require_partner)
):
    """Update listing."""
    partner_id = current_user["partnerId"]
    
    listing = await update_premium_listing(
        listing_id=listing_id,
        partner_id=partner_id,
        update_data=update_data.model_dump(exclude_unset=True)
    )
    
    return listing_to_public_response(listing)


@router.put("/listings/{listing_id}/offerings/{offering_type}", response_model=dict)
async def update_listing_offering(
    listing_id: str,
    offering_type: OfferingType,
    offering_data: OfferingUpdateRequest,
    current_user: dict = Depends(require_partner)
):
    """Update a specific offering."""
    partner_id = current_user["partnerId"]
    
    listing = await update_offering(
        listing_id=listing_id,
        partner_id=partner_id,
        offering_type=offering_type,
        offering_data=offering_data.model_dump(exclude_unset=True)
    )
    
    return listing_to_public_response(listing)


@router.post("/listings/{listing_id}/offerings/{offering_type}/photos", response_model=PhotoUploadResponse)
async def upload_offering_photo(
    listing_id: str,
    offering_type: OfferingType,
    file: UploadFile = File(...),
    enable_compression: bool = True,
    current_user: dict = Depends(require_partner)
):
    """Upload photo for specific offering with advanced compression."""
    partner_id = current_user["partnerId"]
    
    # Enhanced file validation
    is_valid, error_message = validate_image_file(file)
    if not is_valid:
        error_msg = error_message or "File validation failed"
        raise ValidationError(error_msg)
    
    try:
        # Upload with offering-specific compression
        upload_result = await upload_offering_photo(
            file=file,
            listing_id=listing_id,
            offering_type=offering_type,
            tags=["premium-listing", f"partner:{partner_id}"]
        )
        
        # Add photo to listing with compression metadata
        photo = await add_offering_photo(
            listing_id=listing_id,
            partner_id=partner_id,
            offering_type=offering_type,
            photo_data=upload_result
        )
        
        return PhotoUploadResponse(**photo)
        
    except ValidationError:
        # Re-raise validation errors as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Photo upload failed: {str(e)}")


@router.post("/listings/{listing_id}/hero-photos", response_model=PhotoUploadResponse)
async def upload_hero_photo(
    listing_id: str,
    file: UploadFile = File(...),
    current_user: dict = Depends(require_partner)
):
    """Upload hero photo with highest quality compression."""
    partner_id = current_user["partnerId"]
    
    # Enhanced file validation
    is_valid, error_message = validate_image_file(file)
    if not is_valid:
        error_msg = error_message or "File validation failed"
        raise ValidationError(error_msg)
    
    try:
        # Upload with hero-specific compression (higher quality)
        upload_result = await upload_hero_photo(
            file=file,
            listing_id=listing_id,
            tags=["premium-listing", f"partner:{partner_id}", "hero"]
        )
        
        # Add hero photo to listing
        photo = await add_hero_photo(
            listing_id=listing_id,
            partner_id=partner_id,
            photo_data=upload_result
        )
        
        return PhotoUploadResponse(**photo)
        
    except ValidationError:
        # Re-raise validation errors as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Hero photo upload failed: {str(e)}")


@router.get("/listings/{listing_id}/compression-stats")
async def get_listing_compression_stats(
    listing_id: str,
    current_user: dict = Depends(require_partner)
):
    """Get compression statistics for all photos in a listing."""
    partner_id = current_user["partnerId"]
    
    try:
        # Get listing to verify ownership
        listing = await get_premium_listing(listing_id, partner_id)
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Collect all photo public IDs
        public_ids = []
        
        # Hero photos
        for photo in listing.get("heroPhotos", []):
            if isinstance(photo, dict) and "publicId" in photo:
                public_ids.append(photo["publicId"])
        
        # Offering photos
        for offering_type, offering in listing.get("offerings", {}).items():
            for photo in offering.get("photos", []):
                if isinstance(photo, dict) and "publicId" in photo:
                    public_ids.append(photo["publicId"])
        
        # Get compression stats
        stats = await get_compression_stats(public_ids)
        
        return {
            "listing_id": listing_id,
            "stats": stats
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get compression stats: {str(e)}")


@router.delete("/listings/{listing_id}/offerings/{offering_type}/photos/{public_id}")
async def delete_offering_photo(
    listing_id: str,
    offering_type: OfferingType,
    public_id: str,
    current_user: dict = Depends(require_partner)
):
    """Delete photo from specific offering."""
    partner_id = current_user["partnerId"]
    
    # Remove from listing
    success = await remove_offering_photo(
        listing_id=listing_id,
        partner_id=partner_id,
        offering_type=offering_type,
        public_id=public_id
    )
    
    if not success:
        raise NotFoundError("Photo", public_id)
    
    # Delete from Cloudinary
    try:
        await delete_image(public_id)
    except Exception as e:
        # Log error but don't fail the request
        print(f"Failed to delete image from Cloudinary: {e}")
    
    return {"ok": True}


@router.put("/listings/{listing_id}/basic-info")
async def update_listing_basic_info(
    listing_id: str,
    basic_info: dict,
    current_user: dict = Depends(require_partner)
):
    """Update listing basic information (step 1 of wizard)."""
    partner_id = current_user["partnerId"]
    
    # Extract basic info fields
    update_data = {
        "displayName": basic_info.get("displayName"),
        "overview": basic_info.get("overview"),
        "locality": basic_info.get("locality"),
        "city": basic_info.get("city"),
        "amenities": basic_info.get("amenities"),
        "accessHours": basic_info.get("accessHours"),
        "weekendAccess": basic_info.get("weekendAccess")
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    listing = await update_premium_listing(
        listing_id=listing_id,
        partner_id=partner_id,
        update_data=update_data
    )
    
    return listing_to_public_response(listing)


@router.put("/listings/{listing_id}/location")
async def update_listing_location(
    listing_id: str,
    location_data: dict,
    current_user: dict = Depends(require_partner)
):
    """Update listing location information (step 3 of wizard)."""
    partner_id = current_user["partnerId"]
    
    # Extract location fields
    update_data = {
        "locality": location_data.get("locality"),
        "city": location_data.get("city"),
        "approximateCoordinates": location_data.get("approximateCoordinates"),
        "accessHours": location_data.get("accessHours"),
        "customAccessHours": location_data.get("customAccessHours"),
        "weekendAccess": location_data.get("weekendAccess"),
        "twentyFourSevenAccess": location_data.get("twentyFourSevenAccess"),
        "nearMetro": location_data.get("nearMetro"),
        "metroDetails": location_data.get("metroDetails"),
        "parking": location_data.get("parking"),
        "parkingNotes": location_data.get("parkingNotes"),
        "powerBackup": location_data.get("powerBackup"),
        "internetSpeedMbps": location_data.get("internetSpeedMbps"),
        "wifiDetails": location_data.get("wifiDetails"),
        "houseRules": location_data.get("houseRules"),
        "specialInstructions": location_data.get("specialInstructions")
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    listing = await update_premium_listing(
        listing_id=listing_id,
        partner_id=partner_id,
        update_data=update_data
    )
    
    return listing_to_public_response(listing)


@router.post("/listings/{listing_id}/validate")
async def validate_listing(
    listing_id: str,
    current_user: dict = Depends(require_partner)
):
    """Validate listing for submission."""
    partner_id = current_user["partnerId"]
    
    validation = await validate_listing_for_submission(listing_id, partner_id)
    
    return {
        "isValid": validation.isValid,
        "errors": validation.errors,
        "warnings": validation.warnings
    }


@router.post("/listings/{listing_id}/submit")
async def submit_listing(
    listing_id: str,
    current_user: dict = Depends(require_partner)
):
    """Submit listing for admin review."""
    partner_id = current_user["partnerId"]
    
    listing = await submit_listing_for_review(listing_id, partner_id)
    
    return {
        "ok": True,
        "message": "Listing submitted for review",
        "listing": listing_to_public_response(listing)
    }


# Public endpoints for premium listings
@router.get("/public/listings/{slug}", response_model=dict)
async def get_public_listing_by_slug(slug: str):
    """Get public listing detail by slug."""
    listing = await get_premium_listing_by_slug(slug)
    
    # Only return published listings
    if not listing.get("isPublished") or listing.get("verificationStatus") != "APPROVED_VERIFIED":
        raise NotFoundError("Listing", slug)
    
    # Increment view count
    await increment_listing_view(str(listing["_id"]))
    
    return listing_to_public_response(listing)


# Additional endpoints for listing builder
@router.put("/listings/{listing_id}/basic-info")
async def update_listing_basic_info(
    listing_id: str,
    basic_info: dict,
    current_user: dict = Depends(require_partner)
):
    """Update listing basic information (step 1 of wizard)."""
    partner_id = current_user["partnerId"]
    
    # Extract basic info fields
    update_data = {
        "displayName": basic_info.get("displayName"),
        "overview": basic_info.get("overview"),
        "locality": basic_info.get("locality"),
        "city": basic_info.get("city"),
        "amenities": basic_info.get("amenities"),
        "accessHours": basic_info.get("accessHours"),
        "weekendAccess": basic_info.get("weekendAccess")
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    listing = await update_premium_listing(
        listing_id=listing_id,
        partner_id=partner_id,
        update_data=update_data
    )
    
    return listing_to_public_response(listing)


@router.put("/listings/{listing_id}/location")
async def update_listing_location(
    listing_id: str,
    location_data: dict,
    current_user: dict = Depends(require_partner)
):
    """Update listing location information (step 3 of wizard)."""
    partner_id = current_user["partnerId"]
    
    # Extract location fields
    update_data = {
        "locality": location_data.get("locality"),
        "city": location_data.get("city"),
        "approximateCoordinates": location_data.get("approximateCoordinates"),
        "accessHours": location_data.get("accessHours"),
        "customAccessHours": location_data.get("customAccessHours"),
        "weekendAccess": location_data.get("weekendAccess"),
        "twentyFourSevenAccess": location_data.get("twentyFourSevenAccess"),
        "nearMetro": location_data.get("nearMetro"),
        "metroDetails": location_data.get("metroDetails"),
        "parking": location_data.get("parking"),
        "parkingNotes": location_data.get("parkingNotes"),
        "powerBackup": location_data.get("powerBackup"),
        "internetSpeedMbps": location_data.get("internetSpeedMbps"),
        "wifiDetails": location_data.get("wifiDetails"),
        "houseRules": location_data.get("houseRules"),
        "specialInstructions": location_data.get("specialInstructions")
    }
    
    # Remove None values
    update_data = {k: v for k, v in update_data.items() if v is not None}
    
    listing = await update_premium_listing(
        listing_id=listing_id,
        partner_id=partner_id,
        update_data=update_data
    )
    
    return listing_to_public_response(listing)


@router.put("/listings/{listing_id}/offerings/{offering_type}/photos/reorder")
async def reorder_photos(
    listing_id: str,
    offering_type: OfferingType,
    photo_order: List[str],
    current_user: dict = Depends(require_partner)
):
    """Reorder photos within an offering."""
    partner_id = current_user["partnerId"]
    
    listing = await reorder_offering_photos(
        listing_id=listing_id,
        partner_id=partner_id,
        offering_type=offering_type,
        photo_order=photo_order
    )
    
    return listing_to_public_response(listing)


@router.post("/listings/{listing_id}/save")
async def save_listing(
    listing_id: str,
    current_user: dict = Depends(require_partner)
):
    """Save listing (sets status to pending)."""
    partner_id = current_user["partnerId"]
    
    # Get listing to verify ownership
    listing = await get_premium_listing(listing_id, partner_id)
    
    # Update status to pending if not already approved
    if listing.get("verificationStatus") not in ["APPROVED", "APPROVED_VERIFIED"]:
        from app.db.mongodb import get_database
        from datetime import datetime
        db = get_database()
        await db.premium_listings.update_one(
            {"_id": ObjectId(listing_id)},
            {
                "$set": {
                    "verificationStatus": "PENDING",
                    "updatedAt": datetime.utcnow()
                }
            }
        )
    
    return {
        "ok": True,
        "message": "Listing saved successfully"
    }


@router.post("/temp-photos", response_model=TempPhotoUploadResponse)
async def upload_temporary_photo(
    file: UploadFile = File(...),
    offering_type: Optional[str] = Form(None),
    current_user: dict = Depends(require_partner)
):
    """Upload photo to temporary storage without requiring listing ID."""
    partner_id = current_user["partnerId"]
    
    # Debug logging
    print(f"DEBUG: Upload request from partner {partner_id}")
    print(f"DEBUG: File info - name: {file.filename}, type: {file.content_type}, size: {file.size}")
    print(f"DEBUG: Offering type: {offering_type}")
    
    # Enhanced file validation
    is_valid, error_message = validate_image_file(file)
    print(f"DEBUG: Validation result - valid: {is_valid}, error: {error_message}")
    
    if not is_valid:
        error_msg = error_message or "File validation failed"
        print(f"DEBUG: Raising ValidationError: {error_msg}")
        raise ValidationError(error_msg)
    
    try:
        from app.services.cloudinary_service import upload_temporary_photo
        
        # Upload to temporary folder
        upload_result = await upload_temporary_photo(
            file=file,
            partner_id=partner_id,
            offering_type=offering_type,
            tags=["temp-upload", f"partner:{partner_id}"]
        )
        
        return TempPhotoUploadResponse(**upload_result)
        
    except ValidationError:
        # Re-raise validation errors as-is
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Temporary photo upload failed: {str(e)}")


@router.post("/listings/{listing_id}/move-temp-photos")
async def move_temporary_photos(
    listing_id: str,
    temp_photos: List[str],  # List of temporary public IDs
    offering_type: Optional[str] = None,
    current_user: dict = Depends(require_partner)
):
    """Move temporary photos to permanent listing folder."""
    partner_id = current_user["partnerId"]
    
    # Verify listing ownership
    listing = await get_premium_listing(listing_id, partner_id)
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    
    try:
        from app.services.cloudinary_service import move_temporary_photos_to_listing
        
        # Move photos to permanent location
        moved_photos = await move_temporary_photos_to_listing(
            partner_id=partner_id,
            listing_id=listing_id,
            temp_public_ids=temp_photos,
            offering_type=offering_type
        )
        
        # Add photos to listing in database
        if offering_type and moved_photos:
            from app.services.premium_listing_service import add_offering_photo
            
            for photo_data in moved_photos:
                await add_offering_photo(
                    listing_id=listing_id,
                    partner_id=partner_id,
                    offering_type=offering_type,
                    photo_data=photo_data
                )
        
        return {
            "ok": True,
            "moved_photos": moved_photos,
            "message": f"Moved {len(moved_photos)} photos to listing"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to move photos: {str(e)}")


@router.delete("/temp-photos/{public_id}")
async def delete_temporary_photo(
    public_id: str,
    current_user: dict = Depends(require_partner)
):
    """Delete temporary photo."""
    partner_id = current_user["partnerId"]
    
    # Verify the photo belongs to this partner (check if public_id contains partner folder)
    if f"temp/{partner_id}" not in public_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this photo")
    
    try:
        success = await delete_image(public_id)
        if not success:
            raise HTTPException(status_code=404, detail="Photo not found")
        
        return {"ok": True, "message": "Temporary photo deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete photo: {str(e)}")


@router.post("/cleanup-temp-photos")
async def cleanup_old_temporary_photos(
    max_age_hours: int = 24,
    current_user: dict = Depends(require_partner)
):
    """Clean up old temporary photos for current partner."""
    partner_id = current_user["partnerId"]
    
    try:
        from app.services.cloudinary_service import cleanup_temporary_photos
        
        success = await cleanup_temporary_photos(partner_id, max_age_hours)
        
        return {
            "ok": success,
            "message": f"Cleaned up temporary photos older than {max_age_hours} hours"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleanup failed: {str(e)}")