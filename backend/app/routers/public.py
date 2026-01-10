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
    """Get list of known localities grouped by city."""
    # Return localities grouped by city for better organization
    localities_by_city = {
        "Delhi": [
            {"id": "connaught-place", "name": "Connaught Place", "popular": True},
            {"id": "saket", "name": "Saket", "popular": True},
            {"id": "nehru-place", "name": "Nehru Place", "popular": True},
            {"id": "okhla", "name": "Okhla", "popular": True},
            {"id": "dwarka", "name": "Dwarka", "popular": True},
            {"id": "karol-bagh", "name": "Karol Bagh", "popular": True},
            {"id": "greater-kailash", "name": "Greater Kailash", "popular": True},
            {"id": "hauz-khas", "name": "Hauz Khas", "popular": True},
            {"id": "janakpuri", "name": "Janakpuri", "popular": False},
            {"id": "vasant-kunj", "name": "Vasant Kunj", "popular": False},
            {"id": "lajpat-nagar", "name": "Lajpat Nagar", "popular": False},
            {"id": "pitampura", "name": "Pitampura", "popular": False},
            {"id": "rohini", "name": "Rohini", "popular": False},
            {"id": "south-extension", "name": "South Extension", "popular": False},
            {"id": "green-park", "name": "Green Park", "popular": False},
        ],
        "Gurugram": [
            {"id": "cyber-city", "name": "Cyber City", "popular": True},
            {"id": "golf-course-road", "name": "Golf Course Road", "popular": True},
            {"id": "mg-road-gurugram", "name": "MG Road", "popular": True},
            {"id": "udyog-vihar", "name": "Udyog Vihar", "popular": True},
            {"id": "dlf-phase-1", "name": "DLF Phase 1", "popular": True},
            {"id": "sohna-road", "name": "Sohna Road", "popular": False},
            {"id": "sector-32", "name": "Sector 32", "popular": False},
            {"id": "dlf-phase-2", "name": "DLF Phase 2", "popular": False},
            {"id": "dlf-phase-3", "name": "DLF Phase 3", "popular": False},
        ],
        "Noida": [
            {"id": "sector-62", "name": "Sector 62", "popular": True},
            {"id": "sector-63", "name": "Sector 63", "popular": True},
            {"id": "sector-18", "name": "Sector 18", "popular": True},
            {"id": "film-city", "name": "Film City", "popular": True},
            {"id": "city-center", "name": "City Center", "popular": True},
            {"id": "sector-16", "name": "Sector 16", "popular": False},
            {"id": "sector-135", "name": "Sector 135", "popular": False},
            {"id": "botanical-garden", "name": "Botanical Garden", "popular": False},
            {"id": "wave-city", "name": "Wave City", "popular": False},
        ]
    }
    
    # Also provide flat list for backward compatibility
    flat_localities = []
    for city, localities in localities_by_city.items():
        for locality in localities:
            flat_localities.append({
                **locality,
                "city": city
            })
    
    return {
        "by_city": localities_by_city,
        "flat": flat_localities
    }


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
