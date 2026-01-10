"""Premium listing management routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from app.core.security import require_partner
from app.models.premium_listing import (
    PremiumListingCreate,
    PremiumListingUpdate,
    OfferingUpdateRequest,
    OfferingType,
    PhotoUploadResponse
)
from app.services.premium_listing_service import (
    create_premium_listing,
    get_premium_listing,
    get_premium_listing_by_slug,
    update_premium_listing,
    update_offering,
    add_offering_photo,
    remove_offering_photo,
    reorder_offering_photos,
    validate_listing_for_submission,
    submit_listing_for_review,
    get_partner_listings,
    increment_listing_view,
    listing_to_public_response
)
from app.services.cloudinary_service import upload_image, delete_image
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
    current_user: dict = Depends(require_partner)
):
    """Upload photo for specific offering."""
    partner_id = current_user["partnerId"]
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise ValidationError("File must be an image")
    
    # Validate file size (max 10MB)
    if file.size and file.size > 10 * 1024 * 1024:
        raise ValidationError("File size must be less than 10MB")
    
    try:
        # Upload to Cloudinary
        upload_result = await upload_image(
            file=file,
            folder=f"listings/{listing_id}/{offering_type}",
            tags=[listing_id, offering_type, "premium-listing"]
        )
        
        # Add photo to listing
        photo = await add_offering_photo(
            listing_id=listing_id,
            partner_id=partner_id,
            offering_type=offering_type,
            photo_data=upload_result
        )
        
        return PhotoUploadResponse(**photo)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Photo upload failed: {str(e)}")


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