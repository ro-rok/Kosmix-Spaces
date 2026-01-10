"""Analytics service for event tracking and reporting."""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from bson import ObjectId

from app.db.mongodb import get_database
from app.models.analytics import (
    AnalyticsEvent, AnalyticsEventCreate, AnalyticsSummary, PartnerAnalytics,
    EventName, UserRole, ListingPerformance, LocalityPerformance, PartnerPerformance
)
from app.models.listing import WorkspaceListing
from app.models.partner import PartnerAccount


class AnalyticsService:
    """Service for analytics operations."""
    
    def __init__(self):
        self._db = None
    
    @property
    def db(self) -> AsyncIOMotorDatabase:
        """Get database connection (lazy-loaded)."""
        if self._db is None:
            try:
                self._db = get_database()
            except RuntimeError:
                # Database not initialized yet, will retry later
                raise RuntimeError("Database not initialized. Please ensure the application has started properly.")
        return self._db
    
    @property
    def events_collection(self):
        """Get events collection."""
        return self.db.analytics_events
    
    @property
    def listings_collection(self):
        """Get listings collection."""
        return self.db.listings
    
    @property
    def partners_collection(self):
        """Get partners collection."""
        return self.db.partners
    
    async def track_event(self, event_data: AnalyticsEventCreate) -> AnalyticsEvent:
        """Track a single analytics event."""
        # Enrich event with listing/partner context
        enriched_data = await self._enrich_event_data(event_data)
        
        # Create event document
        event = AnalyticsEvent(**enriched_data.model_dump())
        
        # Insert into database
        result = await self.events_collection.insert_one(event.model_dump(by_alias=True))
        event.id = result.inserted_id
        
        return event
    
    async def track_events_batch(self, events_data: List[AnalyticsEventCreate]) -> List[AnalyticsEvent]:
        """Track multiple analytics events in batch."""
        if not events_data:
            return []
        
        # Enrich all events
        enriched_events = []
        for event_data in events_data:
            enriched_data = await self._enrich_event_data(event_data)
            event = AnalyticsEvent(**enriched_data.model_dump())
            enriched_events.append(event)
        
        # Batch insert
        documents = [event.model_dump(by_alias=True) for event in enriched_events]
        result = await self.events_collection.insert_many(documents)
        
        # Update event IDs
        for i, event in enumerate(enriched_events):
            event.id = result.inserted_ids[i]
        
        return enriched_events
    
    async def get_admin_analytics(
        self, 
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> AnalyticsSummary:
        """Get comprehensive analytics for admin dashboard."""
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        # Build date filter
        date_filter = {
            "timestamp": {
                "$gte": start_date,
                "$lte": end_date
            }
        }
        
        # Aggregate key metrics
        pipeline = [
            {"$match": date_filter},
            {
                "$group": {
                    "_id": "$eventName",
                    "count": {"$sum": 1},
                    "uniqueSessions": {"$addToSet": "$sessionId"}
                }
            },
            {
                "$project": {
                    "eventName": "$_id",
                    "count": 1,
                    "uniqueSessions": {"$size": "$uniqueSessions"}
                }
            }
        ]
        
        event_stats = {}
        async for doc in self.events_collection.aggregate(pipeline):
            event_stats[doc["eventName"]] = {
                "count": doc["count"],
                "uniqueSessions": doc["uniqueSessions"]
            }
        
        # Calculate metrics
        total_views = event_stats.get(EventName.LISTING_VIEW, {}).get("count", 0)
        total_enquiries = event_stats.get(EventName.ENQUIRY_SUBMIT, {}).get("count", 0)
        total_searches = event_stats.get(EventName.SEARCH_PERFORMED, {}).get("count", 0)
        partner_signups = event_stats.get(EventName.PARTNER_SIGNUP, {}).get("count", 0)
        
        conversion_rate = (total_enquiries / total_views * 100) if total_views > 0 else 0.0
        
        # Get top listings
        top_listings = await self._get_top_listings(start_date, end_date)
        
        # Get top localities
        top_localities = await self._get_top_localities(start_date, end_date)
        
        return AnalyticsSummary(
            totalViews=total_views,
            totalEnquiries=total_enquiries,
            totalSearches=total_searches,
            partnerSignups=partner_signups,
            conversionRate=round(conversion_rate, 2),
            topListings=top_listings,
            topLocalities=top_localities
        )
    
    async def get_partner_analytics(
        self, 
        partner_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> PartnerAnalytics:
        """Get analytics for a specific partner."""
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        # Get partner's listings
        partner_listings = await self.listings_collection.find(
            {"partnerId": partner_id}
        ).to_list(None)
        
        listing_ids = [str(listing["_id"]) for listing in partner_listings]
        
        if not listing_ids:
            return PartnerAnalytics(
                views=0,
                enquiries=0,
                conversionRate=0.0,
                topListings=[]
            )
        
        # Build filter for partner's listings
        date_filter = {
            "timestamp": {"$gte": start_date, "$lte": end_date},
            "listingId": {"$in": listing_ids}
        }
        
        # Aggregate partner metrics
        pipeline = [
            {"$match": date_filter},
            {
                "$group": {
                    "_id": {
                        "eventName": "$eventName",
                        "listingId": "$listingId"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        listing_stats = {}
        async for doc in self.events_collection.aggregate(pipeline):
            listing_id = doc["_id"]["listingId"]
            event_name = doc["_id"]["eventName"]
            
            if listing_id not in listing_stats:
                listing_stats[listing_id] = {}
            listing_stats[listing_id][event_name] = doc["count"]
        
        # Calculate totals and top listings
        total_views = 0
        total_enquiries = 0
        top_listings = []
        
        for listing in partner_listings:
            listing_id = str(listing["_id"])
            stats = listing_stats.get(listing_id, {})
            
            views = stats.get(EventName.LISTING_VIEW, 0)
            enquiries = stats.get(EventName.ENQUIRY_SUBMIT, 0)
            
            total_views += views
            total_enquiries += enquiries
            
            if views > 0 or enquiries > 0:
                top_listings.append({
                    "listingId": listing_id,
                    "displayName": listing.get("displayName", "Unknown"),
                    "views": views,
                    "enquiries": enquiries
                })
        
        # Sort top listings by views
        top_listings.sort(key=lambda x: x["views"], reverse=True)
        top_listings = top_listings[:10]  # Top 10
        
        conversion_rate = (total_enquiries / total_views * 100) if total_views > 0 else 0.0
        
        return PartnerAnalytics(
            views=total_views,
            enquiries=total_enquiries,
            conversionRate=round(conversion_rate, 2),
            topListings=top_listings
        )
    
    async def get_listing_performance(
        self,
        listing_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> ListingPerformance:
        """Get performance metrics for a specific listing."""
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        # Get listing details
        listing = await self.listings_collection.find_one({"_id": ObjectId(listing_id)})
        if not listing:
            raise ValueError(f"Listing not found: {listing_id}")
        
        # Aggregate listing metrics
        pipeline = [
            {
                "$match": {
                    "listingId": listing_id,
                    "timestamp": {"$gte": start_date, "$lte": end_date}
                }
            },
            {
                "$group": {
                    "_id": "$eventName",
                    "count": {"$sum": 1},
                    "lastActivity": {"$max": "$timestamp"}
                }
            }
        ]
        
        stats = {}
        last_activity = None
        
        async for doc in self.events_collection.aggregate(pipeline):
            stats[doc["_id"]] = doc["count"]
            if not last_activity or doc["lastActivity"] > last_activity:
                last_activity = doc["lastActivity"]
        
        views = stats.get(EventName.LISTING_VIEW, 0)
        enquiries = stats.get(EventName.ENQUIRY_SUBMIT, 0)
        whatsapp_clicks = stats.get(EventName.WHATSAPP_CLICK, 0)
        call_clicks = stats.get(EventName.CALL_CLICK, 0)
        
        conversion_rate = (enquiries / views * 100) if views > 0 else 0.0
        
        return ListingPerformance(
            listingId=listing_id,
            listingSlug=listing.get("slug"),
            displayName=listing.get("displayName"),
            locality=listing.get("locality"),
            views=views,
            enquiries=enquiries,
            whatsappClicks=whatsapp_clicks,
            callClicks=call_clicks,
            conversionRate=round(conversion_rate, 2),
            lastActivity=last_activity
        )
    
    async def _enrich_event_data(self, event_data: AnalyticsEventCreate) -> AnalyticsEventCreate:
        """Enrich event data with listing/partner context."""
        enriched_data = event_data.model_copy()
        
        # Enrich with listing context
        if event_data.listingId:
            try:
                listing = await self.listings_collection.find_one(
                    {"_id": ObjectId(event_data.listingId)}
                )
                if listing:
                    enriched_data.locality = listing.get("locality")
                    enriched_data.city = listing.get("city")
                    if not enriched_data.partnerId:
                        enriched_data.partnerId = listing.get("partnerId")
            except Exception:
                pass  # Invalid ObjectId or listing not found
        
        return enriched_data
    
    async def _get_top_listings(
        self, 
        start_date: datetime, 
        end_date: datetime,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top performing listings by views and enquiries."""
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "eventName": {"$in": [EventName.LISTING_VIEW, EventName.ENQUIRY_SUBMIT]},
                    "listingId": {"$ne": None}
                }
            },
            {
                "$group": {
                    "_id": {
                        "listingId": "$listingId",
                        "eventName": "$eventName"
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": "$_id.listingId",
                    "events": {
                        "$push": {
                            "eventName": "$_id.eventName",
                            "count": "$count"
                        }
                    }
                }
            }
        ]
        
        listing_stats = {}
        async for doc in self.events_collection.aggregate(pipeline):
            listing_id = doc["_id"]
            stats = {"views": 0, "enquiries": 0}
            
            for event in doc["events"]:
                if event["eventName"] == EventName.LISTING_VIEW:
                    stats["views"] = event["count"]
                elif event["eventName"] == EventName.ENQUIRY_SUBMIT:
                    stats["enquiries"] = event["count"]
            
            listing_stats[listing_id] = stats
        
        # Get listing details and combine with stats
        top_listings = []
        for listing_id, stats in listing_stats.items():
            try:
                listing = await self.listings_collection.find_one(
                    {"_id": ObjectId(listing_id)}
                )
                if listing:
                    top_listings.append({
                        "listingId": listing_id,
                        "displayName": listing.get("displayName", "Unknown"),
                        "views": stats["views"],
                        "enquiries": stats["enquiries"]
                    })
            except Exception:
                continue
        
        # Sort by views and limit
        top_listings.sort(key=lambda x: x["views"], reverse=True)
        return top_listings[:limit]
    
    async def _get_top_localities(
        self, 
        start_date: datetime, 
        end_date: datetime,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top localities by searches and views."""
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "eventName": {"$in": [EventName.SEARCH_PERFORMED, EventName.LISTING_VIEW]},
                    "locality": {"$ne": None}
                }
            },
            {
                "$group": {
                    "_id": {
                        "locality": "$locality",
                        "eventName": "$eventName"
                    },
                    "count": {"$sum": 1}
                }
            },
            {
                "$group": {
                    "_id": "$_id.locality",
                    "events": {
                        "$push": {
                            "eventName": "$_id.eventName",
                            "count": "$count"
                        }
                    }
                }
            }
        ]
        
        locality_stats = {}
        async for doc in self.events_collection.aggregate(pipeline):
            locality = doc["_id"]
            stats = {"searches": 0, "views": 0}
            
            for event in doc["events"]:
                if event["eventName"] == EventName.SEARCH_PERFORMED:
                    stats["searches"] = event["count"]
                elif event["eventName"] == EventName.LISTING_VIEW:
                    stats["views"] = event["count"]
            
            locality_stats[locality] = stats
        
        # Convert to list and sort
        top_localities = [
            {
                "locality": locality,
                "searches": stats["searches"],
                "views": stats["views"]
            }
            for locality, stats in locality_stats.items()
        ]
        
        top_localities.sort(key=lambda x: x["searches"], reverse=True)
        return top_localities[:limit]


# Global service instance - lazy initialization
_analytics_service = None

def get_analytics_service() -> AnalyticsService:
    """Get analytics service instance (lazy-loaded)."""
    global _analytics_service
    if _analytics_service is None:
        _analytics_service = AnalyticsService()
    return _analytics_service

# For backward compatibility
analytics_service = get_analytics_service()