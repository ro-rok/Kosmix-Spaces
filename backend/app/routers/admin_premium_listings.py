"""Admin premium listings routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from app.core.security import require_admin
from app.db.mongodb import get_database
from app.services.premium_listing_service import listing_to_public_response
from bson import ObjectId
import datetime

router = APIRouter()


@router.get("/premium-listings")
async def get_admin_premium_listings(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """Get premium listings with filters (admin view)."""
    db = get_database()
    
    query = {}
    if status:
        query["verificationStatus"] = status
    
    total = await db.premium_listings.count_documents(query)
    skip = (page - 1) * pageSize
    
    cursor = db.premium_listings.find(query).sort("createdAt", -1).skip(skip).limit(pageSize)
    listings = await cursor.to_list(length=pageSize)
    
    # Format listings using the proper response formatter
    result = []
    for listing in listings:
        try:
            formatted_listing = listing_to_public_response(listing)
            result.append(formatted_listing)
        except Exception as e:
            # Fallback for listings that might not have all required fields
            listing["_id"] = str(listing["_id"])
            listing["partnerId"] = str(listing["partnerId"])
            result.append(listing)
    
    return result


@router.get("/premium-listings/{listing_id}")
async def get_admin_premium_listing(
    listing_id: str,
    current_user: dict = Depends(require_admin)
):
    """Get premium listing detail (admin view) - supports both ID and slug."""
    db = get_database()
    
    # Try to find by ObjectId first, then by slug
    listing = None
    try:
        # Try as ObjectId first
        listing = await db.premium_listings.find_one({"_id": ObjectId(listing_id)})
    except:
        # If ObjectId fails, try as slug
        listing = await db.premium_listings.find_one({"slugData.slug": listing_id})
    
    if not listing:
        raise HTTPException(status_code=404, detail="Premium listing not found")
    
    # Format using the proper response formatter
    try:
        return listing_to_public_response(listing)
    except Exception as e:
        # Fallback for listings that might not have all required fields
        listing["_id"] = str(listing["_id"])
        listing["partnerId"] = str(listing["partnerId"])
        return listing


@router.post("/premium-listings/{listing_id}/approve")
async def approve_premium_listing(
    listing_id: str,
    notes: Optional[str] = None,
    current_user: dict = Depends(require_admin)
):
    """Approve premium listing - supports both ID and slug."""
    db = get_database()
    
    try:
        # Find the listing first (by ID or slug)
        listing = None
        try:
            listing = await db.premium_listings.find_one({"_id": ObjectId(listing_id)})
        except:
            listing = await db.premium_listings.find_one({"slug": listing_id})
        
        if not listing:
            raise HTTPException(status_code=404, detail="Premium listing not found")
        
        # Update using the actual ObjectId
        result = await db.premium_listings.update_one(
            {"_id": listing["_id"]},
            {
                "$set": {
                    "verificationStatus": "APPROVED_VERIFIED",
                    "status": "published",
                    "adminNotes": notes or f"Approved by admin on {datetime.datetime.now().isoformat()}"
                }
            }
        )
        
        return {"ok": True, "message": "Premium listing approved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to approve premium listing: {str(e)}")


@router.post("/premium-listings/{listing_id}/needs-info")
async def needs_info_premium_listing(
    listing_id: str,
    notes: str,
    current_user: dict = Depends(require_admin)
):
    """Mark premium listing as needs info - supports both ID and slug."""
    db = get_database()
    
    try:
        # Find the listing first (by ID or slug)
        listing = None
        try:
            listing = await db.premium_listings.find_one({"_id": ObjectId(listing_id)})
        except:
            listing = await db.premium_listings.find_one({"slug": listing_id})
        
        if not listing:
            raise HTTPException(status_code=404, detail="Premium listing not found")
        
        # Update using the actual ObjectId
        result = await db.premium_listings.update_one(
            {"_id": listing["_id"]},
            {
                "$set": {
                    "verificationStatus": "NEEDS_INFO",
                    "status": "pending",
                    "adminNotes": notes
                }
            }
        )
        
        return {"ok": True, "message": "Premium listing marked as needs info"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update premium listing: {str(e)}")


@router.post("/premium-listings/{listing_id}/reject")
async def reject_premium_listing(
    listing_id: str,
    reason: str,
    current_user: dict = Depends(require_admin)
):
    """Reject premium listing - supports both ID and slug."""
    db = get_database()
    
    try:
        # Find the listing first (by ID or slug)
        listing = None
        try:
            listing = await db.premium_listings.find_one({"_id": ObjectId(listing_id)})
        except:
            listing = await db.premium_listings.find_one({"slug": listing_id})
        
        if not listing:
            raise HTTPException(status_code=404, detail="Premium listing not found")
        
        # Update using the actual ObjectId
        result = await db.premium_listings.update_one(
            {"_id": listing["_id"]},
            {
                "$set": {
                    "verificationStatus": "REJECTED",
                    "status": "rejected",
                    "adminNotes": reason
                }
            }
        )
        
        return {"ok": True, "message": "Premium listing rejected"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reject premium listing: {str(e)}")