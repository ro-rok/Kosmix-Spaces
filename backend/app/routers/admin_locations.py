"""Admin location management API endpoints."""
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.db.mongodb import get_database
from app.services.location_service import LocationService
from app.models.location import (
    LocalitySearchResponse, LocalityStatus
)
from app.core.security import require_admin

router = APIRouter()


@router.get("/localities/search", response_model=LocalitySearchResponse)
async def search_localities_admin(
    query: Optional[str] = Query(None, description="Search query for locality name"),
    cityId: Optional[str] = Query(None, description="Filter by city ID"),
    status: Optional[LocalityStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    pageSize: int = Query(50, ge=1, le=100, description="Page size"),
    current_user: dict = Depends(require_admin)
):
    """Search localities with filters (admin only)."""
    db = get_database()
    location_service = LocationService(db)
    
    response = await location_service.search_localities(
        query=query,
        city_id=cityId,
        status=status,
        page=page,
        page_size=pageSize
    )
    return response


@router.get("/localities", response_model=LocalitySearchResponse)
async def get_localities_admin(
    status: Optional[LocalityStatus] = Query(None, description="Filter by status"),
    page: int = Query(1, ge=1, description="Page number"),
    pageSize: int = Query(50, ge=1, le=100, description="Page size"),
    current_user: dict = Depends(require_admin)
):
    """Get all localities with optional status filter (admin only)."""
    db = get_database()
    location_service = LocationService(db)
    
    response = await location_service.search_localities(
        query=None,
        city_id=None,
        status=status,
        page=page,
        page_size=pageSize
    )
    return response
