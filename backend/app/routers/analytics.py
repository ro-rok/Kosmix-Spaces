"""Analytics endpoints for event tracking and reporting."""
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.analytics import (
    AnalyticsEventCreate, AnalyticsEventBatch, AnalyticsSummary, 
    PartnerAnalytics, ListingPerformance
)
from app.services.analytics_service import get_analytics_service
from app.core.security import verify_admin_token, verify_partner_token, get_current_partner, get_current_user
from app.core.errors import AppError

router = APIRouter()
security = HTTPBearer()


@router.post("/events", status_code=status.HTTP_201_CREATED)
async def track_events(
    batch: AnalyticsEventBatch
):
    """
    Track analytics events in batch.
    
    This endpoint accepts batches of analytics events for tracking user interactions.
    No authentication required as this is used for anonymous user tracking.
    """
    try:
        analytics_service = get_analytics_service()
        events = await analytics_service.track_events_batch(batch.events)
        return {
            "success": True,
            "eventsTracked": len(events),
            "message": f"Successfully tracked {len(events)} events"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track events: {str(e)}"
        )


@router.post("/events/single", status_code=status.HTTP_201_CREATED)
async def track_single_event(
    event: AnalyticsEventCreate
):
    """
    Track a single analytics event.
    
    Alternative endpoint for tracking individual events.
    No authentication required for anonymous tracking.
    """
    try:
        analytics_service = get_analytics_service()
        tracked_event = await analytics_service.track_event(event)
        return {
            "success": True,
            "eventId": tracked_event.eventId,
            "message": "Event tracked successfully"
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to track event: {str(e)}"
        )


@router.get("/admin", response_model=AnalyticsSummary)
async def get_admin_analytics(
    admin_data: dict = Depends(verify_admin_token),
    start_date: Optional[datetime] = Query(None, description="Start date for analytics (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics (ISO format)")
):
    """
    Get comprehensive analytics for admin dashboard.
    
    Requires admin authentication.
    Returns aggregated metrics including views, enquiries, conversions, and top performers.
    """
    try:
        # Default to last 30 days if no dates provided
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        analytics_service = get_analytics_service()
        analytics = await analytics_service.get_admin_analytics(start_date, end_date)
        return analytics
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch admin analytics: {str(e)}"
        )


@router.get("/partner/{partner_id}", response_model=PartnerAnalytics)
async def get_partner_analytics(
    partner_id: str,
    current_user: dict = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None, description="Start date for analytics (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics (ISO format)")
):
    """
    Get analytics for a specific partner.
    
    Requires partner authentication. Partners can only access their own analytics.
    Admins can access any partner's analytics.
    """
    try:
        # Check if user is admin or the partner themselves
        if current_user.get("role") == "PARTNER":
            if current_user.get("partnerId") != partner_id:
                raise AppError(
                    status_code=status.HTTP_403_FORBIDDEN,
                    code="ACCESS_DENIED",
                    message="Partners can only access their own analytics"
                )
        elif current_user.get("role") != "ADMIN":
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Admin or partner access required"
            )
        
        # Default to last 30 days if no dates provided
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        analytics_service = get_analytics_service()
        analytics = await analytics_service.get_partner_analytics(partner_id, start_date, end_date)
        return analytics
    except AppError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch partner analytics: {str(e)}"
        )


@router.get("/listing/{listing_id}", response_model=ListingPerformance)
async def get_listing_performance(
    listing_id: str,
    current_user: dict = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None, description="Start date for analytics (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics (ISO format)")
):
    """
    Get performance metrics for a specific listing.
    
    Requires authentication. Partners can only access their own listings.
    Admins can access any listing.
    """
    try:
        # Default to last 30 days if no dates provided
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        analytics_service = get_analytics_service()
        performance = await analytics_service.get_listing_performance(listing_id, start_date, end_date)
        
        # If partner is requesting, verify they own the listing
        if current_user.get("role") == "PARTNER":
            from app.db.mongodb import get_database
            from bson import ObjectId
            
            db = get_database()
            listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
            if not listing or listing.get("partnerId") != current_user.get("partnerId"):
                raise AppError(
                    status_code=status.HTTP_403_FORBIDDEN,
                    code="ACCESS_DENIED",
                    message="Partners can only access their own listings"
                )
        elif current_user.get("role") != "ADMIN":
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Admin or partner access required"
            )
        
        return performance
    except AppError:
        raise
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch listing performance: {str(e)}"
        )


@router.get("/health")
async def analytics_health():
    """
    Health check endpoint for analytics service.
    """
    try:
        # Test database connection by counting events
        from app.db.mongodb import get_database
        db = get_database()
        count = await db.analytics_events.count_documents({})
        
        return {
            "status": "healthy",
            "service": "analytics",
            "totalEvents": count,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Analytics service unhealthy: {str(e)}"
        )