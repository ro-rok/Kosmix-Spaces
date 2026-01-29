"""Analytics endpoints for event tracking and reporting."""
from datetime import datetime, timezone, timedelta
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, Query, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.models.analytics import (
    AnalyticsEventCreate, AnalyticsEventBatch, AnalyticsSummary, 
    PartnerAnalytics, ListingPerformance, AnalyticsTimeSeries,
    AnalyticsOverview, TopWorkspace, TopLocality, ConversionFunnel, 
    AnalyticsInsights, FunnelStage, Insight
)
from app.services.analytics_service import get_analytics_service
from app.core.security import verify_admin_token, verify_partner_token, get_current_partner, get_current_user
from app.core.errors import AppError
from app.core.config import get_settings

router = APIRouter()
admin_router = APIRouter()
partner_router = APIRouter()
security = HTTPBearer()
settings = get_settings()


@router.options("/events")
async def options_events():
    """Handle CORS preflight for events endpoint."""
    return {"status": "ok"}


@router.post("/events", status_code=status.HTTP_201_CREATED)
async def track_events(
    batch: AnalyticsEventBatch
):
    """
    Track analytics events in batch (up to 100 events).
    
    This endpoint accepts batches of analytics events for tracking user interactions.
    No authentication required as this is used for anonymous user tracking.
    """
    try:
        if len(batch.events) > 100:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Maximum 100 events per batch"
            )
        
        analytics_service = get_analytics_service()
        events = await analytics_service.track_events_batch(batch.events)
        return {
            "success": True,
            "eventsTracked": len(events),
            "message": f"Successfully tracked {len(events)} events"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
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
    end_date: Optional[datetime] = Query(None, description="End date for analytics (ISO format)"),
    portal: Optional[str] = Query(None, description="Filter by portal: public/partner/admin"),
    event_name: Optional[str] = Query(None, description="Filter by event name")
):
    """
    Get comprehensive analytics for admin dashboard.
    
    Requires admin authentication.
    Returns aggregated metrics including views, enquiries, conversions, top performers,
    time series data, and conversion funnel.
    """
    try:
        # Default to last 30 days if no dates provided
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        # Validate portal filter
        if portal and portal not in ["public", "partner", "admin"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid portal. Must be: public, partner, or admin"
            )
        
        # Parse event name if provided
        event_name_enum = None
        if event_name:
            try:
                from app.models.analytics import EventName
                event_name_enum = EventName(event_name)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid event name: {event_name}"
                )
        
        analytics_service = get_analytics_service()
        analytics = await analytics_service.get_admin_analytics(
            start_date=start_date,
            end_date=end_date,
            portal=portal,
            event_name=event_name_enum
        )
        return analytics
    except HTTPException:
        raise
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
    end_date: Optional[datetime] = Query(None, description="End date for analytics (ISO format)"),
    listing_id: Optional[str] = Query(None, description="Filter by specific listing ID")
):
    """
    Get analytics for a specific partner.
    
    Requires partner authentication. Partners can only access their own analytics.
    Admins can access any partner's analytics.
    Returns views, enquiries, conversion rate, top listings, time series, and trends.
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
        analytics = await analytics_service.get_partner_analytics(
            partner_id=partner_id,
            start_date=start_date,
            end_date=end_date,
            listing_id=listing_id
        )
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
            listing = await db.premium_listings.find_one({"_id": ObjectId(listing_id)})
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


@router.get("/time-series", response_model=AnalyticsTimeSeries)
async def get_time_series(
    current_user: dict = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    partner_id: Optional[str] = Query(None),
    listing_id: Optional[str] = Query(None),
    granularity: str = Query("day", regex="^(day|week|month)$")
):
    """
    Get time-series analytics data for charts.
    
    Requires authentication. Partners can only see their own data.
    """
    try:
        # Authorization: partners can only see their own data
        if current_user.get("role") == "PARTNER":
            if partner_id and partner_id != current_user.get("partnerId"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied - partners can only access their own analytics"
                )
            # Force partner_id to current partner
            partner_id = current_user.get("partnerId")
        
        # Default to last 30 days
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        analytics_service = get_analytics_service()
        time_series = await analytics_service.get_time_series(
            start_date, end_date, partner_id, listing_id, granularity
        )
        return time_series
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch time-series data: {str(e)}"
        )


@router.get("/funnel")
async def get_conversion_funnel(
    current_user: dict = Depends(get_current_user),
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None)
):
    """
    Get conversion funnel metrics.
    
    Admin can see global funnel, partners see their own funnel.
    """
    try:
        partner_id = None
        if current_user.get("role") == "PARTNER":
            partner_id = current_user.get("partnerId")
        
        # Default to last 30 days
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        analytics_service = get_analytics_service()
        
        # For partners, we need to filter by their listings
        # For now, return global funnel (can be enhanced later)
        funnel = await analytics_service.get_conversion_funnel(start_date, end_date)
        return funnel
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversion funnel: {str(e)}"
        )


@router.get("/export")
async def export_analytics_csv(
    admin_data: dict = Depends(verify_admin_token),
    start_date: Optional[datetime] = Query(None, description="Start date for analytics (ISO format)"),
    end_date: Optional[datetime] = Query(None, description="End date for analytics (ISO format)"),
    portal: Optional[str] = Query(None, description="Filter by portal: public/partner/admin"),
    event_name: Optional[str] = Query(None, description="Filter by event name")
):
    """
    Export analytics data as CSV.
    
    Requires admin authentication.
    Returns CSV file with analytics events.
    """
    try:
        from fastapi.responses import Response
        import csv
        from io import StringIO
        
        # Default to last 30 days if no dates provided
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        # Build filter
        filter_query = {
            "timestamp": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        
        if portal:
            filter_query["portal"] = portal
        
        if event_name:
            try:
                from app.models.analytics import EventName
                filter_query["eventName"] = EventName(event_name)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid event name: {event_name}"
                )
        
        # Fetch events
        analytics_service = get_analytics_service()
        cursor = analytics_service.events_collection.find(filter_query).sort("timestamp", -1).limit(10000)
        events = await cursor.to_list(length=10000)
        
        # Generate CSV
        output = StringIO()
        writer = csv.writer(output)
        
        # Write header
        writer.writerow([
            "Event ID", "Event Name", "Timestamp", "Session ID", "User Role",
            "Portal", "Path", "Listing ID", "Listing Slug", "Partner ID",
            "Locality", "City", "Referrer", "Referrer Domain",
            "UTM Source", "UTM Medium", "UTM Campaign", "UTM Term", "UTM Content",
            "Device Type", "Viewport Width", "Viewport Height"
        ])
        
        # Write rows
        for event in events:
            writer.writerow([
                event.get("eventId", ""),
                event.get("eventName", ""),
                event.get("timestamp", "").isoformat() if event.get("timestamp") else "",
                event.get("sessionId", ""),
                event.get("userRole", ""),
                event.get("portal", ""),
                event.get("path", ""),
                event.get("listingId", ""),
                event.get("listingSlug", ""),
                event.get("partnerId", ""),
                event.get("locality", ""),
                event.get("city", ""),
                event.get("referrer", ""),
                event.get("referrerDomain", ""),
                event.get("utmSource", ""),
                event.get("utmMedium", ""),
                event.get("utmCampaign", ""),
                event.get("utmTerm", ""),
                event.get("utmContent", ""),
                event.get("deviceType", ""),
                event.get("viewportWidth", ""),
                event.get("viewportHeight", "")
            ])
        
        csv_content = output.getvalue()
        output.close()
        
        # Return CSV file
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=analytics_export_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.csv"
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to export analytics: {str(e)}"
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


@router.get("/debug/partner/{partner_id}")
async def debug_partner_analytics(
    partner_id: str,
    current_user: dict = Depends(get_current_user)
):
    """
    Debug endpoint to check what events exist for a partner.
    Admin only or partner viewing their own data.
    """
    try:
        # Authorization check
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
        
        from app.db.mongodb import get_database
        from bson import ObjectId
        from datetime import datetime, timezone, timedelta
        
        db = get_database()
        
        # Get partner's listings
        partner_listings = await db.premium_listings.find(
            {"partnerId": ObjectId(partner_id)}
        ).to_list(None)
        
        listing_ids = [str(listing["_id"]) for listing in partner_listings]
        
        # Check events with listingId
        events_with_listing_id = await db.analytics_events.find(
            {"listingId": {"$in": listing_ids}}
        ).limit(10).to_list(10)
        
        # Check events with partnerId
        events_with_partner_id = await db.analytics_events.find(
            {"partnerId": partner_id}
        ).limit(10).to_list(10)
        
        # Check events with listingSlug
        listing_slugs = [listing.get("slugData", {}).get("slug", "") for listing in partner_listings if listing.get("slugData", {}).get("slug")]
        events_with_slug = []
        if listing_slugs:
            events_with_slug = await db.analytics_events.find(
                {"listingSlug": {"$in": listing_slugs}}
            ).limit(10).to_list(10)
        
        return {
            "partnerId": partner_id,
            "listings": {
                "count": len(partner_listings),
                "ids": listing_ids,
                "slugs": listing_slugs
            },
            "events": {
                "withListingId": {
                    "count": len(events_with_listing_id),
                    "sample": [{"eventName": e.get("eventName"), "listingId": e.get("listingId"), "listingSlug": e.get("listingSlug"), "partnerId": e.get("partnerId")} for e in events_with_listing_id]
                },
                "withPartnerId": {
                    "count": len(events_with_partner_id),
                    "sample": [{"eventName": e.get("eventName"), "listingId": e.get("listingId"), "listingSlug": e.get("listingSlug"), "partnerId": e.get("partnerId")} for e in events_with_partner_id]
                },
                "withSlug": {
                    "count": len(events_with_slug),
                    "sample": [{"eventName": e.get("eventName"), "listingId": e.get("listingId"), "listingSlug": e.get("listingSlug"), "partnerId": e.get("partnerId")} for e in events_with_slug]
                }
            }
        }
    except AppError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Debug query failed: {str(e)}"
        )


# Admin Analytics Endpoints
@admin_router.get("/analytics/overview", response_model=AnalyticsOverview)
async def get_admin_analytics_overview(
    admin_data: dict = Depends(verify_admin_token),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)")
):
    """Get admin analytics overview with period comparison."""
    try:
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        analytics_service = get_analytics_service()
        overview = await analytics_service.get_analytics_overview(start, end)
        return overview
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch admin analytics overview: {str(e)}"
        )


@admin_router.get("/analytics/timeseries", response_model=AnalyticsTimeSeries)
async def get_admin_analytics_timeseries(
    admin_data: dict = Depends(verify_admin_token),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)"),
    metric: Optional[str] = Query(None, description="Filter by metric: views, clicks, enquiries, whatsapp, calls, emails")
):
    """Get admin analytics time series data."""
    try:
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        metrics_list = None
        if metric:
            metrics_list = [metric]
        
        analytics_service = get_analytics_service()
        time_series = await analytics_service.get_time_series(start, end, metrics=metrics_list)
        return time_series
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch admin analytics time series: {str(e)}"
        )


@admin_router.get("/analytics/top-workspaces", response_model=List[TopWorkspace])
async def get_admin_top_workspaces(
    admin_data: dict = Depends(verify_admin_token),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)"),
    limit: int = Query(10, ge=1, le=50, description="Number of results")
):
    """Get top performing workspaces (partners)."""
    try:
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        analytics_service = get_analytics_service()
        top_workspaces = await analytics_service.get_top_workspaces(start, end, limit)
        return top_workspaces
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch top workspaces: {str(e)}"
        )


@admin_router.get("/analytics/top-localities", response_model=List[TopLocality])
async def get_admin_top_localities(
    admin_data: dict = Depends(verify_admin_token),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)"),
    limit: int = Query(10, ge=1, le=50, description="Number of results")
):
    """Get top performing localities."""
    try:
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        analytics_service = get_analytics_service()
        top_localities = await analytics_service.get_top_localities(start, end, limit)
        return top_localities
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch top localities: {str(e)}"
        )


@admin_router.get("/analytics/funnel", response_model=ConversionFunnel)
async def get_admin_funnel(
    admin_data: dict = Depends(verify_admin_token),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)")
):
    """Get admin conversion funnel."""
    try:
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        analytics_service = get_analytics_service()
        funnel = await analytics_service.get_enhanced_funnel(start, end)
        return funnel
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversion funnel: {str(e)}"
        )


@admin_router.get("/analytics/insights", response_model=AnalyticsInsights)
async def get_admin_insights(
    admin_data: dict = Depends(verify_admin_token),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)")
):
    """Get admin analytics insights."""
    try:
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        analytics_service = get_analytics_service()
        insights = await analytics_service.get_analytics_insights(start, end)
        return insights
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch insights: {str(e)}"
        )


# Partner Analytics Endpoints
@partner_router.get("/analytics/overview", response_model=AnalyticsOverview)
async def get_partner_analytics_overview(
    current_user: dict = Depends(get_current_user),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)")
):
    """Get partner analytics overview with period comparison."""
    try:
        # Verify partner access
        if current_user.get("role") != "PARTNER":
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Partner access required"
            )
        
        partner_id = current_user.get("partnerId")
        if not partner_id:
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Partner ID not found"
            )
        
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        analytics_service = get_analytics_service()
        overview = await analytics_service.get_analytics_overview(start, end, partner_id=partner_id)
        return overview
    except AppError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch partner analytics overview: {str(e)}"
        )


@partner_router.get("/analytics/timeseries", response_model=AnalyticsTimeSeries)
async def get_partner_analytics_timeseries(
    current_user: dict = Depends(get_current_user),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)"),
    metric: Optional[str] = Query(None, description="Filter by metric: views, clicks, enquiries, whatsapp, calls, emails")
):
    """Get partner analytics time series data."""
    try:
        # Verify partner access
        if current_user.get("role") != "PARTNER":
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Partner access required"
            )
        
        partner_id = current_user.get("partnerId")
        if not partner_id:
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Partner ID not found"
            )
        
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        metrics_list = None
        if metric:
            metrics_list = [metric]
        
        analytics_service = get_analytics_service()
        time_series = await analytics_service.get_time_series(start, end, partner_id=partner_id, metrics=metrics_list)
        return time_series
    except AppError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch partner analytics time series: {str(e)}"
        )


@partner_router.get("/analytics/top-localities", response_model=List[TopLocality])
async def get_partner_top_localities(
    current_user: dict = Depends(get_current_user),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)"),
    limit: int = Query(10, ge=1, le=50, description="Number of results")
):
    """Get top performing localities for partner."""
    try:
        # Verify partner access
        if current_user.get("role") != "PARTNER":
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Partner access required"
            )
        
        partner_id = current_user.get("partnerId")
        if not partner_id:
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Partner ID not found"
            )
        
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        analytics_service = get_analytics_service()
        top_localities = await analytics_service.get_top_localities(start, end, limit, partner_id=partner_id)
        return top_localities
    except AppError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch top localities: {str(e)}"
        )


@partner_router.get("/analytics/funnel", response_model=ConversionFunnel)
async def get_partner_funnel(
    current_user: dict = Depends(get_current_user),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)")
):
    """Get partner conversion funnel."""
    try:
        # Verify partner access
        if current_user.get("role") != "PARTNER":
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Partner access required"
            )
        
        partner_id = current_user.get("partnerId")
        if not partner_id:
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Partner ID not found"
            )
        
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        analytics_service = get_analytics_service()
        funnel = await analytics_service.get_enhanced_funnel(start, end, partner_id=partner_id)
        return funnel
    except AppError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch conversion funnel: {str(e)}"
        )


@partner_router.get("/analytics/insights", response_model=AnalyticsInsights)
async def get_partner_insights(
    current_user: dict = Depends(get_current_user),
    start: Optional[datetime] = Query(None, description="Start date (ISO format)"),
    end: Optional[datetime] = Query(None, description="End date (ISO format)")
):
    """Get partner analytics insights."""
    try:
        # Verify partner access
        if current_user.get("role") != "PARTNER":
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Partner access required"
            )
        
        partner_id = current_user.get("partnerId")
        if not partner_id:
            raise AppError(
                status_code=status.HTTP_403_FORBIDDEN,
                code="ACCESS_DENIED",
                message="Partner ID not found"
            )
        
        # Default to last 7 days
        if not end:
            end = datetime.now(timezone.utc)
        if not start:
            start = end - timedelta(days=7)
        
        analytics_service = get_analytics_service()
        insights = await analytics_service.get_analytics_insights(start, end, partner_id=partner_id)
        return insights
    except AppError:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch insights: {str(e)}"
        )