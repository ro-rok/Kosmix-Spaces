"""Premium listing management routes."""
from typing import List, Optional
from datetime import datetime
from bson import ObjectId
from pydantic import BaseModel
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.security import require_partner
from app.db.mongodb import get_database
from app.models.premium_listing import (
    PremiumListingCreate,
    PremiumListingUpdate,
    OfferingUpdateRequest,
    OfferingType,
    PhotoUploadResponse,
    TempPhotoUploadResponse,
    MoveTempPhotosRequest
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
    validate_image_file,
    get_compression_stats
)
from app.core.errors import ValidationError, NotFoundError

router = APIRouter()


class PhotoData(BaseModel):
    url: str
    publicId: str
    width: int
    height: int
    bytes: int
    format: str


class OfferingPhotos(BaseModel):
    photos: List[PhotoData] = []


class SubmitListingRequest(BaseModel):
    """Request model for submitting listing with all data including photos."""
    displayName: str
    overview: str
    locality: str
    city: str = "Delhi"
    amenities: List[str] = []
    accessHours: Optional[str] = "9 AM - 9 PM"
    weekendAccess: bool = False
    nearMetro: bool = False
    metroNote: Optional[str] = None
    parking: Optional[str] = "NONE"
    powerBackup: bool = False
    # Hero photos
    heroPhotos: List[PhotoData] = []
    # Offerings with their photos
    offerings: dict = {}


@router.post("/upload-photo")
async def upload_photo_to_cloudinary(
    file: UploadFile = File(...),
    offering_type: str = Form("hero"),
    current_user: dict = Depends(require_partner)
):
    """
    Upload photo directly to Cloudinary and return URL.
    Photo is NOT saved to database - just uploaded to cloud storage.
    Frontend keeps the URL in form state until listing is submitted.
    """
    partner_id = current_user["partnerId"]
    
    # Validate file
    is_valid, error_message = validate_image_file(file)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_message)
    
    try:
        # Upload to Cloudinary
        result = await upload_image(
            file=file,
            folder=f"kosmixspaces/partners/{partner_id}/{offering_type}",
            tags=[f"partner:{partner_id}", f"offering:{offering_type}"]
        )
        
        # Check if the result contains the expected fields
        if not isinstance(result, dict):
            raise HTTPException(status_code=500, detail=f"Unexpected Cloudinary response type: {type(result)}")
        
        if "url" not in result:
            raise HTTPException(status_code=500, detail=f"Cloudinary response missing url. Response: {result}")
        
        return {
            "ok": True,
            "photo": {
                "url": result["url"],
                "publicId": result["publicId"],
                "width": result["width"],
                "height": result["height"],
                "bytes": result["bytes"],
                "format": result["format"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Photo upload failed: {str(e)}")


@router.delete("/delete-photo/{public_id:path}")
async def delete_photo_from_cloudinary(
    public_id: str,
    current_user: dict = Depends(require_partner)
):
    """Delete photo from Cloudinary (before listing is submitted)."""
    partner_id = current_user["partnerId"]
    
    # Verify the photo belongs to this partner
    if f"partners/{partner_id}" not in public_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this photo")
    
    try:
        success = await delete_image(public_id)
        if not success:
            raise HTTPException(status_code=404, detail="Photo not found")
        
        return {"ok": True, "message": "Photo deleted"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete photo: {str(e)}")


@router.post("/listings/submit")
async def submit_listing_with_photos(
    request: SubmitListingRequest,
    current_user: dict = Depends(require_partner)
):
    """
    Submit complete listing with all data including photos.
    This creates the listing and saves all photos to database in one operation.
    """
    partner_id = current_user["partnerId"]
    
    print(f"DEBUG: Starting submission for partner {partner_id}")
    print(f"DEBUG: Request data - displayName: {request.displayName}")
    print(f"DEBUG: Request data - locality: {request.locality}")
    print(f"DEBUG: Request data - offerings keys: {list(request.offerings.keys())}")
    
    try:
        # Collect all photos from offerings to use as hero photos
        all_photos = []
        for offering_type, offering_data in request.offerings.items():
            if offering_data.get("enabled") and offering_data.get("photos"):
                for photo_data in offering_data["photos"]:
                    # Validate photo data has required fields
                    if all(key in photo_data for key in ["url", "publicId", "width", "height", "bytes", "format"]):
                        all_photos.append(photo_data)
        
        # Use first photo as hero photo if no hero photos provided
        hero_photos_to_add = request.heroPhotos if request.heroPhotos else []
        if not hero_photos_to_add and all_photos:
            hero_photos_to_add = [all_photos[0]]  # Use first photo from offerings as hero
        
        # Create the listing with all data
        listing_data = {
            "displayName": request.displayName,
            "overview": request.overview,
            "locality": request.locality,
            "city": request.city,
            "amenities": request.amenities,
            "accessHours": request.accessHours,
            "weekendAccess": request.weekendAccess,
            "nearMetro": request.nearMetro,
            "metroNote": request.metroNote,
            "parking": request.parking,
            "powerBackup": request.powerBackup,
        }
        
        # Create the listing
        print(f"DEBUG: Creating listing with data: {listing_data}")
        listing = await create_premium_listing(partner_id, listing_data)
        listing_id = str(listing["_id"])
        print(f"DEBUG: Created listing with ID: {listing_id}")
        
        # Add hero photos to database
        for photo_data in hero_photos_to_add:
            try:
                await add_hero_photo(
                    listing_id=listing_id,
                    partner_id=partner_id,
                    photo_data=photo_data if isinstance(photo_data, dict) else photo_data
                )
            except Exception as e:
                print(f"Error adding hero photo: {e}")
                # Continue with other photos
        
        # Add offering photos to database
        for offering_type, offering_data in request.offerings.items():
            if offering_data.get("enabled"):
                try:
                    # Update offering data
                    await update_offering(
                        listing_id=listing_id,
                        partner_id=partner_id,
                        offering_type=offering_type,
                        offering_data=offering_data
                    )
                    
                    # Add photos for this offering if they exist
                    if offering_data.get("photos"):
                        for photo_data in offering_data["photos"]:
                            try:
                                await add_offering_photo(
                                    listing_id=listing_id,
                                    partner_id=partner_id,
                                    offering_type=offering_type,
                                    photo_data=photo_data
                                )
                            except Exception as e:
                                print(f"Error adding offering photo for {offering_type}: {e}")
                                # Continue with other photos
                except Exception as e:
                    print(f"Error updating offering {offering_type}: {e}")
                    # Continue with other offerings
        
        # Submit for review
        await submit_listing_for_review(listing_id, partner_id)
        
        # Get final listing data
        final_listing = await get_premium_listing(listing_id, partner_id)
        
        return {
            "ok": True,
            "listingId": listing_id,
            "message": "Listing submitted successfully",
            "listing": listing_to_public_response(final_listing)
        }
        
    except Exception as e:
        print(f"DEBUG: Error in submission: {str(e)}")
        print(f"DEBUG: Error type: {type(e)}")
        import traceback
        print(f"DEBUG: Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Failed to submit listing: {str(e)}")


@router.get("/listings/stats", response_model=dict)
async def get_partner_listings_stats(
    current_user: dict = Depends(require_partner)
):
    """Get partner listings statistics."""
    partner_id = current_user["partnerId"]
    db = get_database()
    
    # Get all listings for this partner
    listings = await db.premium_listings.find({"partnerId": ObjectId(partner_id)}).to_list(length=None)
    
    # Count by status
    total_listings = len(listings)
    pending_review = len([l for l in listings if l.get("verificationStatus") in ["PENDING", "NEEDS_INFO"]])
    approved = len([l for l in listings if l.get("verificationStatus") in ["APPROVED", "APPROVED_VERIFIED"]])
    rejected = len([l for l in listings if l.get("verificationStatus") == "REJECTED"])
    
    # Get analytics data
    total_views = sum(l.get("viewCount", 0) for l in listings)
    total_enquiries = sum(l.get("enquiryCount", 0) for l in listings)
    
    return {
        "totalListings": total_listings,
        "pendingReview": pending_review,
        "approved": approved,
        "rejected": rejected,
        "totalViews": total_views,
        "totalEnquiries": total_enquiries
    }


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
    """Get listing by ID or slug (partner's own listings only)."""
    partner_id = current_user["partnerId"]
    db = get_database()
    
    print(f"DEBUG: Partner {partner_id} requesting listing {listing_id}")
    
    # Try to find by ObjectId first, then by slug
    listing = None
    try:
        listing = await db.premium_listings.find_one({
            "_id": ObjectId(listing_id),
            "partnerId": ObjectId(partner_id)
        })
        print(f"DEBUG: Found by ObjectId: {listing is not None}")
    except Exception as e:
        print(f"DEBUG: ObjectId lookup failed: {e}")
    
    # If not found by ID, try by slug
    if not listing:
        listing = await db.premium_listings.find_one({
            "slugData.slug": listing_id,
            "partnerId": ObjectId(partner_id)
        })
        print(f"DEBUG: Found by slug: {listing is not None}")
    
    # Also try partial slug match
    if not listing:
        listing = await db.premium_listings.find_one({
            "slugData.slug": {"$regex": listing_id, "$options": "i"},
            "partnerId": ObjectId(partner_id)
        })
        print(f"DEBUG: Found by partial slug: {listing is not None}")
    
    if not listing:
        print(f"DEBUG: No listing found for partner {partner_id} with identifier {listing_id}")
        raise HTTPException(status_code=404, detail="Listing not found")
    
    print(f"DEBUG: Returning listing: {listing['_id']}")
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
    request: MoveTempPhotosRequest,
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
            temp_public_ids=request.temp_photos,
            offering_type=request.offering_type
        )
        
        # Add photos to listing in database
        if moved_photos:
            if request.offering_type and request.offering_type != "hero":
                # Add to specific offering
                for photo_data in moved_photos:
                    await add_offering_photo(
                        listing_id=listing_id,
                        partner_id=partner_id,
                        offering_type=request.offering_type,
                        photo_data=photo_data
                    )
            else:
                # Add as hero photos (when offering_type is None or "hero")
                for photo_data in moved_photos:
                    await add_hero_photo(
                        listing_id=listing_id,
                        partner_id=partner_id,
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


@router.put("/listings/{listing_id}/availability")
async def update_listing_availability(
    listing_id: str,
    request: dict,
    current_user: dict = Depends(require_partner)
):
    """Update listing availability status (available/unavailable)."""
    partner_id = current_user["partnerId"]
    
    availability_status = request.get("availability_status")
    if not availability_status:
        raise HTTPException(status_code=400, detail="availability_status is required")
    
    # Validate availability status
    valid_statuses = ["available", "unavailable", "limited", "waitlist"]
    if availability_status not in valid_statuses:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid availability status. Must be one of: {', '.join(valid_statuses)}"
        )
    
    try:
        from app.db.mongodb import get_database
        from datetime import datetime
        
        db = get_database()
        
        # Update the listing's availability status
        result = await db.premium_listings.update_one(
            {
                "_id": ObjectId(listing_id),
                "partnerId": ObjectId(partner_id)
            },
            {
                "$set": {
                    "availabilityStatus": availability_status,
                    "updatedAt": datetime.utcnow()
                }
            }
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Get updated listing
        listing = await get_premium_listing(listing_id, partner_id)
        
        return {
            "ok": True,
            "message": f"Availability status updated to {availability_status}",
            "listing": listing_to_public_response(listing)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update availability: {str(e)}")