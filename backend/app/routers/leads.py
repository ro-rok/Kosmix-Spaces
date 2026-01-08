"""Admin leads routes."""
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from app.core.security import require_admin
from app.schemas.lead import EnquiryLeadResponse, EnquiryLeadUpdate
from app.services.lead_service import list_leads, update_lead
from app.core.errors import NotFoundError
from bson import ObjectId

router = APIRouter()


@router.get("/leads", response_model=List[EnquiryLeadResponse])
async def get_admin_leads(
    status: Optional[str] = Query(None),
    locality: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    pageSize: int = Query(50, ge=1, le=100),
    current_user: dict = Depends(require_admin)
):
    """Get leads with filters."""
    leads, total = await list_leads(
        status=status,
        locality=locality,
        page=page,
        page_size=pageSize
    )
    
    return [
        EnquiryLeadResponse(
            leadId=str(l["_id"]),
            name=l["name"],
            phone=l["phone"],
            email=l.get("email"),
            company=l.get("company"),
            teamSizeBand=l.get("teamSizeBand"),
            preferredLocalities=l.get("preferredLocalities", []),
            budgetBandId=l.get("budgetBandId"),
            spaceType=l.get("spaceType"),
            moveInTimeframe=l.get("moveInTimeframe"),
            meetingRoomsAddon=l.get("meetingRoomsAddon", False),
            gstInvoiceRequired=l.get("gstInvoiceRequired", False),
            parkingNeeded=l.get("parkingNeeded", False),
            powerBackupRequired=l.get("powerBackupRequired", False),
            nearMetroPreferred=l.get("nearMetroPreferred", False),
            notes=l.get("notes"),
            source=l.get("source", "website"),
            listingSlug=l.get("listingSlug"),
            status=l.get("status", "NEW"),
            assignedTo=l.get("assignedTo"),
            priority=l.get("priority", "NORMAL"),
            createdAt=l["createdAt"],
            updatedAt=l["updatedAt"]
        )
        for l in leads
    ]


@router.patch("/leads/{lead_id}", response_model=EnquiryLeadResponse)
async def update_admin_lead(
    lead_id: str,
    updates: EnquiryLeadUpdate,
    current_user: dict = Depends(require_admin)
):
    """Update lead status, assign, priority."""
    update_dict = {}
    if updates.status is not None:
        update_dict["status"] = updates.status
    if updates.assignedTo is not None:
        update_dict["assignedTo"] = updates.assignedTo
    if updates.priority is not None:
        update_dict["priority"] = updates.priority
    
    updated_lead = await update_lead(lead_id, update_dict)
    
    return EnquiryLeadResponse(
        leadId=str(updated_lead["_id"]),
        name=updated_lead["name"],
        phone=updated_lead["phone"],
        email=updated_lead.get("email"),
        company=updated_lead.get("company"),
        teamSizeBand=updated_lead.get("teamSizeBand"),
        preferredLocalities=updated_lead.get("preferredLocalities", []),
        budgetBandId=updated_lead.get("budgetBandId"),
        spaceType=updated_lead.get("spaceType"),
        moveInTimeframe=updated_lead.get("moveInTimeframe"),
        meetingRoomsAddon=updated_lead.get("meetingRoomsAddon", False),
        gstInvoiceRequired=updated_lead.get("gstInvoiceRequired", False),
        parkingNeeded=updated_lead.get("parkingNeeded", False),
        powerBackupRequired=updated_lead.get("powerBackupRequired", False),
        nearMetroPreferred=updated_lead.get("nearMetroPreferred", False),
        notes=updated_lead.get("notes"),
        source=updated_lead.get("source", "website"),
        listingSlug=updated_lead.get("listingSlug"),
        status=updated_lead.get("status", "NEW"),
        assignedTo=updated_lead.get("assignedTo"),
        priority=updated_lead.get("priority", "NORMAL"),
        createdAt=updated_lead["createdAt"],
        updatedAt=updated_lead["updatedAt"]
    )
