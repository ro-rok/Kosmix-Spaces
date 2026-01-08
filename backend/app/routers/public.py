"""Public API routes."""
from typing import Optional
from fastapi import APIRouter, Query, HTTPException
from app.services.listing_service import (
    filter_listings,
    listing_to_public_card,
    listing_to_public_detail
)
from app.services.lead_service import create_lead, build_whatsapp_link
from app.services.visit_service import create_visit_request
from app.schemas.lead import EnquiryLeadCreate, LeadCreateResponse
from app.schemas.visit import SiteVisitCreate, VisitCreateResponse
from app.core.errors import NotFoundError
from app.db.mongodb import get_database

router = APIRouter()


@router.get("/localities")
async def get_localities():
    """Get list of known localities."""
    # For MVP, return hardcoded list. In production, this could come from a config or database.
    localities = [
        {"id": "connaught-place", "name": "Connaught Place", "city": "Delhi", "popular": True},
        {"id": "saket", "name": "Saket", "city": "Delhi", "popular": True},
        {"id": "nehru-place", "name": "Nehru Place", "city": "Delhi", "popular": True},
        {"id": "okhla", "name": "Okhla", "city": "Delhi", "popular": True},
        {"id": "janakpuri", "name": "Janakpuri", "city": "Delhi", "popular": False},
        {"id": "dwarka", "name": "Dwarka", "city": "Delhi", "popular": True},
        {"id": "vasant-kunj", "name": "Vasant Kunj", "city": "Delhi", "popular": False},
        {"id": "lajpat-nagar", "name": "Lajpat Nagar", "city": "Delhi", "popular": False},
        {"id": "karol-bagh", "name": "Karol Bagh", "city": "Delhi", "popular": True},
        {"id": "pitampura", "name": "Pitampura", "city": "Delhi", "popular": False},
        {"id": "rohini", "name": "Rohini", "city": "Delhi", "popular": False},
        {"id": "greater-kailash", "name": "Greater Kailash", "city": "Delhi", "popular": True},
        {"id": "south-extension", "name": "South Extension", "city": "Delhi", "popular": False},
        {"id": "hauz-khas", "name": "Hauz Khas", "city": "Delhi", "popular": True},
        {"id": "green-park", "name": "Green Park", "city": "Delhi", "popular": False},
    ]
    return localities


@router.get("/listings")
async def get_listings(
    locality: Optional[str] = Query(None),
    budgetBandId: Optional[str] = Query(None),
    teamSizeBand: Optional[str] = Query(None),
    spaceType: Optional[str] = Query(None),
    nearMetro: Optional[bool] = Query(None),
    parking: Optional[str] = Query(None),
    powerBackup: Optional[bool] = Query(None),
    gstInvoice: Optional[bool] = Query(None),
    sort: str = Query("best_match", regex="^(best_match|budget_low|recent_verified)$"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100)
):
    """Get public listings with filters."""
    listings, total = await filter_listings(
        locality=locality,
        budget_band_id=budgetBandId,
        team_size_band=teamSizeBand,
        space_type=spaceType,
        near_metro=nearMetro,
        parking=parking,
        power_backup=powerBackup,
        gst_invoice=gstInvoice,
        sort=sort,
        page=page,
        page_size=pageSize
    )
    
    items = [listing_to_public_card(listing) for listing in listings]
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "pageSize": pageSize
    }


@router.get("/listings/{slug}")
async def get_listing_detail(slug: str):
    """Get public listing detail by slug."""
    db = get_database()
    listing = await db.listings.find_one({
        "slug": slug,
        "verificationStatus": "APPROVED_VERIFIED"
    })
    
    if not listing:
        raise NotFoundError("Listing", slug)
    
    return listing_to_public_detail(listing)


@router.post("/leads", response_model=LeadCreateResponse)
async def create_enquiry_lead(lead: EnquiryLeadCreate):
    """Create an enquiry lead."""
    lead_data = lead.model_dump()
    created_lead = await create_lead(lead_data)
    
    whatsapp_link = build_whatsapp_link(
        name=lead.name,
        phone=lead.phone,
        preferred_localities=lead.preferredLocalities,
        budget_band=lead.budgetBandId,
        team_size=lead.teamSizeBand,
        space_type=lead.spaceType
    )
    
    return LeadCreateResponse(
        leadId=str(created_lead["_id"]),
        message="Thank you! We'll get back to you within 3 hours.",
        whatsappDeepLink=whatsapp_link
    )


@router.post("/site-visits", response_model=VisitCreateResponse)
async def create_site_visit(visit: SiteVisitCreate):
    """Create a site visit request."""
    from app.services.lead_service import create_lead
    from bson import ObjectId
    
    # First create a lead if needed
    lead_data = {
        "name": visit.name,
        "phone": visit.phone,
        "email": visit.email,
        "source": "site-visit",
        "status": "VISIT_REQUESTED"
    }
    created_lead = await create_lead(lead_data)
    
    # Create visit request
    visit_data = {
        "leadId": created_lead["_id"],
        "listingIds": [ObjectId(lid) for lid in visit.listingIds],
        "preferredSlots": [slot.model_dump() for slot in visit.preferredSlots],
        "visitorCount": visit.visitorCount
    }
    created_visit = await create_visit_request(visit_data)
    
    return VisitCreateResponse(
        visitRequestId=str(created_visit["_id"]),
        message="Visit request received! We'll confirm within 3 hours."
    )
