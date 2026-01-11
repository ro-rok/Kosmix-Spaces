"""Location management API endpoints."""
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.security import HTTPBearer

from app.db.mongodb import get_database
from app.services.location_service import LocationService
from app.models.location import (
    LocalityRequest, LocalityApprovalRequest, LocalityStatus,
    LocalitySearchResponse, LocalitiesByCityResponse, Locality, City
)
from app.core.security import get_current_partner, get_current_admin

router = APIRouter(prefix="/api/locations", tags=["locations"])
security = HTTPBearer()


@router.get("/cities", response_model=List[City])
async def get_cities():
    """Get all active cities."""
    db = get_database()
    location_service = LocationService(db)
    
    # Initialize default data if needed
    await location_service.initialize_default_data()
    
    cities = await location_service.get_cities(active_only=True)
    return cities


@router.get("/localities", response_model=LocalitiesByCityResponse)
async def get_localities(
    status: Optional[LocalityStatus] = Query(LocalityStatus.APPROVED, description="Filter by status")
):
    """Get localities grouped by city."""
    db = get_database()
    location_service = LocationService(db)
    
    # Initialize default data if needed
    await location_service.initialize_default_data()
    
    response = await location_service.get_localities_by_city(status=status)
    return response


@router.get("/localities/search", response_model=LocalitySearchResponse)
async def search_localities(
    query: Optional[str] = Query(None, description="Search query for locality name"),
    city_id: Optional[str] = Query(None, description="Filter by city ID"),
    status: Optional[LocalityStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Page size")
):
    """Search localities with filters."""
    db = get_database()
    location_service = LocationService(db)
    
    response = await location_service.search_localities(
        query=query,
        city_id=city_id,
        status=status,
        page=page,
        page_size=page_size
    )
    return response


@router.post("/localities", response_model=Locality)
async def add_locality(
    request: LocalityRequest,
    current_partner: Dict[str, Any] = Depends(get_current_partner)
):
    """Add a new locality (requires partner authentication)."""
    db = get_database()
    location_service = LocationService(db)
    
    try:
        # Set the partner ID
        request.addedBy = current_partner["partnerId"]
        
        locality = await location_service.add_locality(request)
        return locality
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/localities/{locality_id}/approve", response_model=Locality)
async def approve_locality(
    locality_id: str,
    request: LocalityApprovalRequest,
    current_admin: Dict[str, Any] = Depends(get_current_admin)
):
    """Approve or reject a locality (requires admin authentication)."""
    db = get_database()
    location_service = LocationService(db)
    
    try:
        # Set the locality ID from path
        request.localityId = locality_id
        
        locality = await location_service.approve_locality(request, current_admin["adminId"])
        return locality
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Legacy endpoint for backward compatibility
@router.get("/localities-legacy")
async def get_localities_legacy():
    """Legacy localities endpoint for backward compatibility."""
    db = get_database()
    location_service = LocationService(db)
    
    # Initialize default data if needed
    await location_service.initialize_default_data()
    
    # Get approved localities
    response = await location_service.get_localities_by_city(status=LocalityStatus.APPROVED)
    
    # Convert to legacy format
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