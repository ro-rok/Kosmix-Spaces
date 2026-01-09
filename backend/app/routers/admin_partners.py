"""Admin partner management routes."""
from typing import List, Optional, Literal
from fastapi import APIRouter, Depends, Query, Request
from bson import ObjectId
from datetime import datetime

from app.core.security import require_admin
from app.db.mongodb import get_database
from app.schemas.partner import PartnerResponse
from app.core.errors import NotFoundError, ValidationError
from pydantic import BaseModel

router = APIRouter()


class PartnerStatusUpdate(BaseModel):
    """Partner status update request."""
    status: str
    notes: Optional[str] = None


class PartnerListResponse(BaseModel):
    """Partner list response."""
    items: List[PartnerResponse]
    total: int
    page: int
    pageSize: int


@router.get("/partners", response_model=PartnerListResponse)
async def get_partners(
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """Get all partners with filtering and pagination."""
    db = get_database()
    
    # Build filter
    filter_query = {}
    if status:
        filter_query["status"] = status
    if search:
        filter_query["$or"] = [
            {"workspaceBrandName": {"$regex": search, "$options": "i"}},
            {"contactName": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    
    # Get total count
    total = await db.partners.count_documents(filter_query)
    
    # Get paginated results
    skip = (page - 1) * pageSize
    cursor = db.partners.find(filter_query).skip(skip).limit(pageSize).sort("createdAt", -1)
    partners = await cursor.to_list(length=pageSize)
    
    # Convert to response format
    items = [
        PartnerResponse(
            partnerId=str(partner["_id"]),
            workspaceBrandName=partner["workspaceBrandName"],
            contactName=partner["contactName"],
            phone=partner["phone"],
            email=partner["email"],
            status=partner["status"]
        )
        for partner in partners
    ]
    
    return PartnerListResponse(
        items=items,
        total=total,
        page=page,
        pageSize=pageSize
    )


@router.get("/partners/{partner_id}", response_model=PartnerResponse)
async def get_partner(
    partner_id: str,
    current_user: dict = Depends(require_admin)
):
    """Get partner by ID."""
    db = get_database()
    
    try:
        partner = await db.partners.find_one({"_id": ObjectId(partner_id)})
    except:
        raise NotFoundError("Partner", partner_id)
    
    if not partner:
        raise NotFoundError("Partner", partner_id)
    
    return PartnerResponse(
        partnerId=str(partner["_id"]),
        workspaceBrandName=partner["workspaceBrandName"],
        contactName=partner["contactName"],
        phone=partner["phone"],
        email=partner["email"],
        status=partner["status"]
    )


@router.patch("/partners/{partner_id}/status", response_model=PartnerResponse)
async def update_partner_status(
    partner_id: str,
    request: Request,
    current_user: dict = Depends(require_admin)
):
    """Update partner status (approve/suspend/etc)."""
    db = get_database()
    
    # Parse request body manually
    try:
        body = await request.json()
        print(f"Received request body: {body}")
        
        # Validate required fields
        if "status" not in body:
            raise ValidationError("Missing required field: status")
        
        status_value = body["status"]
        notes = body.get("notes")
        
        print(f"Status: '{status_value}' (type: {type(status_value)})")
        print(f"Notes: '{notes}' (type: {type(notes)})")
        
    except Exception as e:
        print(f"Error parsing request body: {e}")
        raise ValidationError(f"Invalid request body: {str(e)}")
    
    # Validate status
    valid_statuses = ["ACTIVE", "PENDING", "SUSPENDED"]
    if status_value not in valid_statuses:
        raise ValidationError(f"Invalid status '{status_value}'. Must be one of: {', '.join(valid_statuses)}")
    
    try:
        partner_obj_id = ObjectId(partner_id)
    except Exception:
        raise ValidationError(f"Invalid partner ID format: {partner_id}")
    
    # Check if partner exists first
    existing_partner = await db.partners.find_one({"_id": partner_obj_id})
    if not existing_partner:
        raise NotFoundError("Partner", partner_id)
    
    # Update partner status
    update_data = {
        "status": status_value,
        "updatedAt": datetime.utcnow()
    }
    
    if notes:
        update_data["adminNotes"] = notes
    
    result = await db.partners.update_one(
        {"_id": partner_obj_id},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise NotFoundError("Partner", partner_id)
    
    # Get updated partner
    partner = await db.partners.find_one({"_id": partner_obj_id})
    
    return PartnerResponse(
        partnerId=str(partner["_id"]),
        workspaceBrandName=partner["workspaceBrandName"],
        contactName=partner["contactName"],
        phone=partner["phone"],
        email=partner["email"],
        status=partner["status"]
    )


@router.delete("/partners/{partner_id}")
async def delete_partner(
    partner_id: str,
    current_user: dict = Depends(require_admin)
):
    """Delete partner account."""
    db = get_database()
    
    try:
        partner_obj_id = ObjectId(partner_id)
    except:
        raise NotFoundError("Partner", partner_id)
    
    result = await db.partners.delete_one({"_id": partner_obj_id})
    
    if result.deleted_count == 0:
        raise NotFoundError("Partner", partner_id)
    
    return {"message": "Partner deleted successfully"}