"""Enhanced public API routes for premium listings."""
from typing import Optional, List
from fastapi import APIRouter, Query, HTTPException, Request
from app.services.premium_listing_service import (
    get_premium_listing_by_slug,
    increment_listing_view,
    increment_listing_enquiry,
    listing_to_public_response
)
from app.services.slug_service import find_listing_by_slug
from app.services.lead_service import create_lead, build_whatsapp_link
from app.services.visit_service import create_visit_request
from app.schemas.lead import EnquiryLeadCreate, LeadCreateResponse
from app.schemas.visit import SiteVisitCreate, VisitCreateResponse
from app.core.errors import NotFoundError
from app.db.mongodb import get_database
from bson import ObjectId

router = APIRouter()


@router.get("/localities")
async def get_localities():
    """Get list of known localities with enhanced data grouped by city."""
    from app.services.location_service import LocationService
    from app.models.location import LocalityStatus
    
    db = get_database()
    location_service = LocationService(db)
    
    # Initialize default data if needed
    await location_service.initialize_default_data()
    
    # Get approved localities
    response = await location_service.get_localities_by_city(status=LocalityStatus.APPROVED)
    
    # Convert to legacy format for backward compatibility
    localities_by_city = {}
    flat_localities = []
    
    for city_id, localities in response.by_city.items():
        # Find city name
        city_name = city_id.title()
        for city in response.cities:
            if city.id == city_id:
                city_name = city.name
                break
        
        localities_by_city[city_name] = []
        
        for locality in localities:
            legacy_locality = {
                "id": locality.id,
                "name": locality.name,
                "popular": locality.popular,
                "metroConnected": locality.metroConnected
            }
            localities_by_city[city_name].append(legacy_locality)
            
            # Add to flat list with city
            flat_localities.append({
                **legacy_locality,
                "city": city_name
            })
    
    return {
        "by_city": localities_by_city,
        "localities": flat_localities  # Alternative key for backward compatibility
    }


@router.get("/listings")
async def get_enhanced_listings(
    # Search and filtering
    query: Optional[str] = Query(None, description="Search query for listings"),
    locality: Optional[str] = Query(None, description="Filter by locality (single value)"),
    budgetBand: Optional[str] = Query(None, description="Filter by budget band (single value)"),
    teamSize: Optional[str] = Query(None, description="Filter by team size"),
    
    # Amenity filters
    meetingRooms: Optional[bool] = Query(None, description="Filter by meeting rooms availability"),
    privateOffice: Optional[bool] = Query(None, description="Filter by private office availability"),
    verifiedOnly: Optional[bool] = Query(None, description="Show only verified listings"),
    amenities: Optional[str] = Query(None, description="Filter by amenities (comma-separated)"),
    
    # Legacy filters for backward compatibility
    budgetBandId: Optional[str] = Query(None, description="Legacy budget band filter"),
    teamSizeBand: Optional[str] = Query(None, description="Legacy team size filter"),
    spaceType: Optional[str] = Query(None, description="Legacy space type filter"),
    nearMetro: Optional[bool] = Query(None, description="Filter by metro proximity"),
    parking: Optional[str] = Query(None, description="Filter by parking availability"),
    powerBackup: Optional[bool] = Query(None, description="Filter by power backup"),
    gstInvoice: Optional[bool] = Query(None, description="Filter by GST invoice availability"),
    
    # Sorting and pagination
    sort: str = Query("best_match", description="Sort order: best_match, recommended, most_enquired, budget_low"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, ge=1, le=100)
):
    """Get enhanced listings with advanced filtering."""
    db = get_database()
    
    # Validate sort parameter
    valid_sorts = ["best_match", "recommended", "most_enquired", "budget_low"]
    if sort not in valid_sorts:
        sort = "best_match"
    
    # Build query for premium listings
    query_filter = {
        "isPublished": True,
        "verificationStatus": "APPROVED_VERIFIED"
        # Removed the requirement for enabled offerings - approved listings should be visible
    }
    
    # Text search
    if query:
        query_filter["$text"] = {"$search": query}
    
    # Locality filter (handle single value)
    if locality:
        query_filter["location.locality"] = locality
    
    # Legacy locality filter
    if budgetBandId:
        # Map legacy budget band to new format
        if not budgetBand:
            budgetBand = budgetBandId
    
    # Team size filter
    team_size_filter = teamSize or teamSizeBand
    if team_size_filter:
        # Add team size logic based on offerings capacity
        pass  # TODO: Implement team size filtering based on offerings
    
    # Verified only filter
    if verifiedOnly:
        query_filter["verificationStatus"] = "APPROVED_VERIFIED"
    
    # Metro proximity filter
    if nearMetro:
        query_filter["location.nearMetro"] = True
    
    # Offering-specific filters
    offering_filters = []
    
    if meetingRooms:
        offering_filters.append({"offerings.meeting-rooms.enabled": True})
    
    if privateOffice:
        offering_filters.append({"offerings.private-offices.enabled": True})
    
    if offering_filters:
        query_filter["$and"] = offering_filters
    
    # Amenities filter (handle comma-separated string)
    if amenities:
        amenity_list = [a.strip() for a in amenities.split(',') if a.strip()]
        if amenity_list:
            query_filter["amenities"] = {"$in": amenity_list}
    
    # Build sort criteria
    sort_criteria = []
    if sort == "recommended" or sort == "best_match":
        # Sort by view count and enquiry count
        sort_criteria = [("viewCount", -1), ("enquiryCount", -1), ("updatedAt", -1)]
    elif sort == "most_enquired":
        sort_criteria = [("enquiryCount", -1), ("viewCount", -1)]
    elif sort == "budget_low":
        # Sort by lowest starting price in enabled offerings
        sort_criteria = [("updatedAt", -1)]  # TODO: Implement price-based sorting
    else:
        sort_criteria = [("updatedAt", -1)]
    
    # Execute query with pagination
    skip = (page - 1) * pageSize
    
    # Query premium listings only
    cursor = db.premium_listings.find(query_filter).sort(sort_criteria).skip(skip).limit(pageSize)
    listings = await cursor.to_list(length=pageSize)
    
    # Get total count
    total = await db.premium_listings.count_documents(query_filter)
    
    # Convert premium listings to public format
    items = [listing_to_public_response(listing) for listing in listings]
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "pageSize": pageSize,
        "sort": sort
    }


@router.get("/listings/{slug:path}")
async def get_enhanced_listing_detail(slug: str, request: Request):
    """Get enhanced listing detail by slug with analytics tracking."""
    
    # Find premium listing by slug
    listing = await find_listing_by_slug(slug)
    
    if not listing:
        raise NotFoundError("Listing", slug)
    
    # Check if it's published and verified
    if not listing.get("isPublished") or listing.get("verificationStatus") != "APPROVED_VERIFIED":
        raise NotFoundError("Listing", slug)
    
    # Note: Removed the check for enabled offerings - approved listings should be accessible
    
    # Check if user has created an enquiry for this listing
    enquiry_created = False
    session_id = request.headers.get("X-Session-ID") or request.cookies.get("session_id")
    if session_id:
        # Check if enquiry exists for this listing and session
        db = get_database()
        lead = await db.leads.find_one({
            "listingSlug": slug,
            "sessionId": session_id
        })
        enquiry_created = bool(lead)
    
    # Increment view count
    await increment_listing_view(str(listing["_id"]))
    
    return listing_to_public_response(listing, enquiry_created=enquiry_created)


@router.post("/leads", response_model=LeadCreateResponse)
async def create_enhanced_lead(lead: EnquiryLeadCreate, request: Request):
    """Create an enquiry lead with enhanced tracking."""
    # Get session ID from header or cookie
    session_id = request.headers.get("X-Session-ID") or request.cookies.get("session_id")
    
    lead_data = lead.model_dump()
    created_lead = await create_lead(lead_data, session_id=session_id)
    
    # If lead is for a specific listing, increment enquiry count
    if lead.listingSlug:
        listing = await find_listing_by_slug(lead.listingSlug)
        if listing and "slugData" in listing:  # Premium listing
            await increment_listing_enquiry(str(listing["_id"]))
    
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
async def create_enhanced_site_visit(visit: SiteVisitCreate):
    """Create a site visit request with enhanced tracking."""
    from app.services.lead_service import create_lead
    
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
    
    # Increment enquiry count for premium listings
    for listing_id in visit.listingIds:
        try:
            listing = await get_database().premium_listings.find_one({"_id": ObjectId(listing_id)})
            if listing:
                await increment_listing_enquiry(listing_id)
        except:
            pass  # Continue if listing not found
    
    return VisitCreateResponse(
        visitRequestId=str(created_visit["_id"]),
        message="Visit request received! We'll confirm within 3 hours."
    )


@router.get("/search/suggestions")
async def get_search_suggestions(
    query: str = Query(..., min_length=2, description="Search query for suggestions")
):
    """Get search suggestions based on query."""
    db = get_database()
    
    # Get locality suggestions
    locality_suggestions = []
    localities = await get_localities()
    
    for locality in localities:
        if query.lower() in locality["name"].lower():
            locality_suggestions.append({
                "type": "locality",
                "text": locality["name"],
                "value": locality["id"]
            })
    
    # Get listing name suggestions
    listing_suggestions = []
    cursor = db.premium_listings.find(
        {
            "isPublished": True,
            "verificationStatus": "APPROVED_VERIFIED",
            "$text": {"$search": query}
        },
        {"displayName": 1, "location.locality": 1}
    ).limit(5)
    
    async for listing in cursor:
        listing_suggestions.append({
            "type": "listing",
            "text": listing["displayName"],
            "subtitle": listing["location"]["locality"],
            "value": listing["slugData"]["slug"]
        })
    
    return {
        "suggestions": locality_suggestions + listing_suggestions
    }


@router.get("/featured")
async def get_featured_listings(limit: int = Query(6, ge=1, le=20)):
    """Get featured listings for homepage."""
    db = get_database()
    
    # Get top listings by view count and enquiry count
    cursor = db.premium_listings.find(
        {
            "isPublished": True,
            "verificationStatus": "APPROVED_VERIFIED"
        }
    ).sort([("viewCount", -1), ("enquiryCount", -1)]).limit(limit)
    
    listings = await cursor.to_list(length=limit)
    
    return {
        "items": [listing_to_public_response(listing) for listing in listings]
    }


@router.get("/listings/{slug:path}/related")
async def get_related_listings(slug: str, limit: int = Query(6, ge=1, le=12)):
    """Get related listings from same locality."""
    db = get_database()
    
    # Find current listing
    listing = await find_listing_by_slug(slug)
    if not listing:
        raise NotFoundError("Listing", slug)
    
    locality = listing.get("location", {}).get("locality")
    city = listing.get("location", {}).get("city", "Delhi")
    current_listing_id = listing["_id"]
    
    # Query same locality listings
    query_filter = {
        "isPublished": True,
        "verificationStatus": "APPROVED_VERIFIED",
        "location.locality": locality,
        "location.city": city,
        "_id": {"$ne": current_listing_id}
    }
    
    # Get listings sorted by popularity
    cursor = db.premium_listings.find(query_filter).sort([
        ("viewCount", -1),
        ("enquiryCount", -1)
    ]).limit(limit)
    
    listings = await cursor.to_list(length=limit)
    
    # If not enough results, expand to same city
    if len(listings) < limit:
        city_query = {
            "isPublished": True,
            "verificationStatus": "APPROVED_VERIFIED",
            "location.city": city,
            "_id": {"$nin": [current_listing_id] + [l["_id"] for l in listings]}
        }
        additional = await db.premium_listings.find(city_query).sort([
            ("viewCount", -1)
        ]).limit(limit - len(listings)).to_list(length=limit - len(listings))
        listings.extend(additional)
    
    return {
        "items": [listing_to_public_response(l) for l in listings],
        "total": len(listings)
    }