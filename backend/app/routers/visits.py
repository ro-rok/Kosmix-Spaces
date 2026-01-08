"""Admin site visits routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.security import require_admin
from app.schemas.visit import SiteVisitResponse, SiteVisitUpdate
from app.services.visit_service import list_visits, update_visit_request
from app.core.errors import NotFoundError
from bson import ObjectId

router = APIRouter()


@router.get("/site-visits", response_model=List[SiteVisitResponse])
async def get_admin_visits(
    status: Optional[str] = Query(None),
    leadId: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """Get site visits with filters."""
    visits, total = await list_visits(
        status=status,
        lead_id=leadId,
        page=page,
        page_size=pageSize
    )
    
    return [
        SiteVisitResponse(
            visitRequestId=str(v["_id"]),
            leadId=str(v["leadId"]),
            listingIds=[str(lid) for lid in v.get("listingIds", [])],
            preferredSlots=v.get("preferredSlots", []),
            visitorCount=v.get("visitorCount", 1),
            status=v.get("status", "REQUESTED"),
            confirmedSlot=v.get("confirmedSlot"),
            opsOwner=v.get("opsOwner"),
            partnerNotes=v.get("partnerNotes"),
            customerNotes=v.get("customerNotes"),
            createdAt=v["createdAt"],
            updatedAt=v["updatedAt"]
        )
        for v in visits
    ]


@router.patch("/site-visits/{visit_id}", response_model=SiteVisitResponse)
async def update_admin_visit(
    visit_id: str,
    updates: SiteVisitUpdate,
    current_user: dict = Depends(require_admin)
):
    """Update visit status + confirmedSlot."""
    update_dict = {}
    if updates.status is not None:
        update_dict["status"] = updates.status
    if updates.confirmedSlot is not None:
        update_dict["confirmedSlot"] = updates.confirmedSlot
    if updates.opsOwner is not None:
        update_dict["opsOwner"] = updates.opsOwner
    if updates.partnerNotes is not None:
        update_dict["partnerNotes"] = updates.partnerNotes
    if updates.customerNotes is not None:
        update_dict["customerNotes"] = updates.customerNotes
    
    updated_visit = await update_visit_request(visit_id, update_dict)
    
    return SiteVisitResponse(
        visitRequestId=str(updated_visit["_id"]),
        leadId=str(updated_visit["leadId"]),
        listingIds=[str(lid) for lid in updated_visit.get("listingIds", [])],
        preferredSlots=updated_visit.get("preferredSlots", []),
        visitorCount=updated_visit.get("visitorCount", 1),
        status=updated_visit.get("status", "REQUESTED"),
        confirmedSlot=updated_visit.get("confirmedSlot"),
        opsOwner=updated_visit.get("opsOwner"),
        partnerNotes=updated_visit.get("partnerNotes"),
        customerNotes=updated_visit.get("customerNotes"),
        createdAt=updated_visit["createdAt"],
        updatedAt=updated_visit["updatedAt"]
    )
