"""Analytics service for event tracking and reporting."""
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from bson import ObjectId

from app.db.mongodb import get_database
from app.models.analytics import (
    AnalyticsEvent, AnalyticsEventCreate, AnalyticsSummary, PartnerAnalytics,
    EventName, UserRole, ListingPerformance, LocalityPerformance, PartnerPerformance,
    AnalyticsTimeSeries, TimeSeriesDataPoint, AnalyticsOverview, PeriodComparison,
    TopWorkspace, TopLocality, ConversionFunnel, FunnelStage, AnalyticsInsights, Insight
)
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
        """Get premium listings collection."""
        return self.db.premium_listings
    
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
        """Track multiple analytics events in batch (up to 100 events)."""
        if not events_data:
            return []
        
        if len(events_data) > 100:
            raise ValueError("Maximum 100 events per batch")
        
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
        end_date: Optional[datetime] = None,
        portal: Optional[str] = None,
        event_name: Optional[EventName] = None
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
        
        # Add portal filter if specified
        if portal:
            date_filter["portal"] = portal
        
        # Add event name filter if specified
        if event_name:
            date_filter["eventName"] = event_name
        
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
        
        # Get time series data
        time_series = await self.get_time_series(start_date, end_date)
        time_series_data = [
            {
                "date": dp.date.isoformat(),
                "views": dp.views,
                "enquiries": dp.enquiries,
                "searches": dp.searches
            }
            for dp in time_series.dataPoints
        ]
        
        # Get funnel data
        funnel = await self.get_conversion_funnel(start_date, end_date)
        
        return AnalyticsSummary(
            totalViews=total_views,
            totalEnquiries=total_enquiries,
            totalSearches=total_searches,
            partnerSignups=partner_signups,
            conversionRate=round(conversion_rate, 2),
            topListings=top_listings,
            topLocalities=top_localities,
            timeSeries=time_series_data,
            funnel=funnel
        )
    
    async def get_partner_analytics(
        self,
        partner_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None,
        listing_id: Optional[str] = None
    ) -> PartnerAnalytics:
        """Get analytics for a specific partner."""
        if not start_date:
            start_date = datetime.now(timezone.utc) - timedelta(days=30)
        if not end_date:
            end_date = datetime.now(timezone.utc)
        
        # Debug: Log date range
        import os
        if os.getenv("DEBUG", "False").lower() == "true" or os.getenv("APP_ENV", "").lower() in ["dev", "development"]:
            print(f"[Analytics] Partner analytics date range: {start_date} to {end_date}")
        
        # Get partner's listings first
        # Handle both ObjectId and string formats for partnerId
        try:
            partner_id_obj = ObjectId(partner_id)
            partner_listings = await self.listings_collection.find(
                {"partnerId": partner_id_obj}
            ).to_list(None)
        except:
            # If ObjectId conversion fails, try as string
            partner_listings = await self.listings_collection.find(
                {"partnerId": partner_id}
            ).to_list(None)
        
        listing_ids = [str(listing["_id"]) for listing in partner_listings]
        
        if not listing_ids:
            # No listings for this partner
            return PartnerAnalytics(
                views=0,
                enquiries=0,
                whatsappClicks=0,
                callClicks=0,
                conversionRate=0.0,
                topListings=[],
                timeSeries=[],
                trends=None
            )
        
        # Build filter - match events by listingId OR partnerId OR listingSlug
        # This handles cases where enrichment might have failed to set partnerId
        # Also match by listingSlug in case listingId wasn't set
        or_conditions = [
            {"listingId": {"$in": listing_ids}},
            {"partnerId": partner_id},  # String format
        ]
        
        # Also try ObjectId format for partnerId
        try:
            partner_id_obj = ObjectId(partner_id)
            or_conditions.append({"partnerId": partner_id_obj})
        except:
            pass
        
        # Add slug matching conditions
        listing_slugs = []
        for listing in partner_listings:
            slug_data = listing.get("slugData", {})
            if slug_data and slug_data.get("slug"):
                slug = slug_data.get("slug")
                listing_slugs.append(slug)
                # Match exact slug or normalized format
                or_conditions.append({"listingSlug": slug})
                # Also match normalized format
                if not slug.startswith('/listing/'):
                    or_conditions.append({"listingSlug": f"/listing/{slug.lstrip('/')}"})
        
        date_filter = {
            "timestamp": {"$gte": start_date, "$lte": end_date},
            "$or": or_conditions
        }
        
        if listing_id:
            # Filter by specific listing
            date_filter = {
                "timestamp": {"$gte": start_date, "$lte": end_date},
                "$or": [
                    {"listingId": listing_id},
                    # Also try to match by slug
                    *([{"listingSlug": {"$regex": f"/listing/.*{listing.get('slugData', {}).get('slug', '')}", "$options": "i"}} 
                       for listing in partner_listings 
                       if str(listing["_id"]) == listing_id and listing.get("slugData", {}).get("slug")] 
                      if partner_listings else [])
                ]
            }
        
        # Debug: Log what we're querying for
        import os
        if os.getenv("DEBUG", "False").lower() == "true" or os.getenv("APP_ENV", "").lower() in ["dev", "development"]:
            print(f"[Analytics] Partner analytics query - partner_id: {partner_id}, listing_ids: {listing_ids}, date_filter: {date_filter}")
            # Check how many events match
            event_count = await self.events_collection.count_documents(date_filter)
            print(f"[Analytics] Events matching date filter: {event_count}")
            # Check events with listingId
            listing_events = await self.events_collection.count_documents({"listingId": {"$in": listing_ids}})
            print(f"[Analytics] Events with matching listingId: {listing_events}")
            # Check events with partnerId
            partner_events = await self.events_collection.count_documents({"partnerId": partner_id})
            print(f"[Analytics] Events with matching partnerId: {partner_events}")
        
        # Aggregate partner metrics
        # Match events that have listingId OR listingSlug (in case enrichment failed)
        # Combine date filter with listingId/listingSlug existence check
        pipeline_match = {
            "timestamp": {"$gte": start_date, "$lte": end_date},
            "$and": [
                {"$or": or_conditions}
            ]
        }
        
        # Only add the listingId/listingSlug existence check if we don't have listing_id filter
        # (when filtering by specific listing, we know it exists)
        if not listing_id:
            pipeline_match["$and"].append({
                "$or": [
                    {"listingId": {"$exists": True, "$ne": None}},
                    {"listingSlug": {"$exists": True, "$ne": None}}
                ]
            })
        
        pipeline = [
            {
                "$match": pipeline_match
            },
            {
                "$group": {
                    "_id": {
                        "eventName": "$eventName",
                        "listingId": "$listingId",
                        "listingSlug": "$listingSlug"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        listing_stats = {}
        total_pipeline_events = 0
        async for doc in self.events_collection.aggregate(pipeline):
            total_pipeline_events += 1
            listing_id = doc["_id"].get("listingId")
            listing_slug = doc["_id"].get("listingSlug")
            event_name = doc["_id"]["eventName"]
            
            # If no listingId but we have a slug, try to resolve it
            if not listing_id and listing_slug:
                try:
                    # Normalize slug
                    normalized_slug = listing_slug if listing_slug.startswith('/listing/') else f"/listing/{listing_slug.lstrip('/')}"
                    listing = await self.listings_collection.find_one({"slugData.slug": normalized_slug})
                    if listing:
                        listing_id = str(listing["_id"])
                        # Verify it belongs to this partner
                        listing_partner_id = str(listing.get("partnerId")) if listing.get("partnerId") else None
                        if listing_partner_id != partner_id:
                            # Skip events for listings that don't belong to this partner
                            continue
                except Exception as e:
                    pass  # Skip if resolution fails
            
            # Only count if we have a listingId that belongs to this partner
            # Also verify the listingId is in our partner's listings
            if listing_id:
                # Double-check: verify this listing belongs to the partner
                if listing_id in listing_ids:
                    if listing_id not in listing_stats:
                        listing_stats[listing_id] = {}
                    listing_stats[listing_id][event_name] = listing_stats[listing_id].get(event_name, 0) + doc["count"]
        
        # Calculate totals and top listings
        total_views = 0
        total_enquiries = 0
        total_whatsapp_clicks = 0
        total_call_clicks = 0
        top_listings = []
        
        # Get listing details if not filtering by specific listing
        if not listing_id:
            partner_listings = await self.listings_collection.find(
                {"partnerId": partner_id}
            ).to_list(None)
        else:
            listing = await self.listings_collection.find_one({"_id": ObjectId(listing_id)})
            partner_listings = [listing] if listing else []
        
        for listing in partner_listings:
            listing_id = str(listing["_id"])
            stats = listing_stats.get(listing_id, {})
            
            views = stats.get(EventName.LISTING_VIEW, 0)
            enquiries = stats.get(EventName.ENQUIRY_SUBMIT, 0)
            whatsapp_clicks = stats.get(EventName.WHATSAPP_CLICK, 0)
            call_clicks = stats.get(EventName.CALL_CLICK, 0)
            
            total_views += views
            total_enquiries += enquiries
            total_whatsapp_clicks += whatsapp_clicks
            total_call_clicks += call_clicks
            
            if views > 0 or enquiries > 0:
                top_listings.append({
                    "listingId": listing_id,
                    "displayName": listing.get("displayName", "Unknown"),
                    "views": views,
                    "enquiries": enquiries,
                    "whatsappClicks": whatsapp_clicks,
                    "callClicks": call_clicks,
                    "conversionRate": round((enquiries / views * 100) if views > 0 else 0.0, 2)
                })
        
        # Sort top listings by views
        top_listings.sort(key=lambda x: x["views"], reverse=True)
        top_listings = top_listings[:10]  # Top 10
        
        conversion_rate = (total_enquiries / total_views * 100) if total_views > 0 else 0.0
        
        # Get time series data
        time_series = await self.get_time_series(start_date, end_date, partner_id=partner_id, listing_id=listing_id)
        time_series_data = [
            {
                "date": dp.date.isoformat(),
                "views": dp.views,
                "enquiries": dp.enquiries
            }
            for dp in time_series.dataPoints
        ]
        
        # Calculate trends (compare with previous period)
        prev_start = start_date - (end_date - start_date)
        prev_time_series = await self.get_time_series(prev_start, start_date, partner_id=partner_id, listing_id=listing_id)
        prev_views = sum(dp.views for dp in prev_time_series.dataPoints)
        prev_enquiries = sum(dp.enquiries for dp in prev_time_series.dataPoints)
        
        views_change = ((total_views - prev_views) / prev_views * 100) if prev_views > 0 else 0.0
        enquiries_change = ((total_enquiries - prev_enquiries) / prev_enquiries * 100) if prev_enquiries > 0 else 0.0
        
        return PartnerAnalytics(
            views=total_views,
            enquiries=total_enquiries,
            whatsappClicks=total_whatsapp_clicks,
            callClicks=total_call_clicks,
            conversionRate=round(conversion_rate, 2),
            topListings=top_listings,
            timeSeries=time_series_data,
            trends={
                "viewsChange": round(views_change, 2),
                "enquiriesChange": round(enquiries_change, 2)
            }
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
            event_name = doc["_id"]
            stats[event_name] = doc["count"]
            activity = doc["lastActivity"]
            if not last_activity or activity > last_activity:
                last_activity = activity
        
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
        """Enrich event data with listing/partner context and derived fields."""
        enriched_data = event_data.model_copy()
        
        # Normalize event names (backward compatibility)
        # Map listing_card_click to listing_click for consistency
        if enriched_data.eventName == EventName.LISTING_CARD_CLICK:
            enriched_data.eventName = EventName.LISTING_CLICK
        
        # Extract referrer domain if not provided
        if enriched_data.referrer and not enriched_data.referrerDomain:
            enriched_data.referrerDomain = self._extract_domain(enriched_data.referrer)
        
        # Detect device type from user agent if not provided
        if enriched_data.userAgent and not enriched_data.deviceType:
            enriched_data.deviceType = self._detect_device_type(enriched_data.userAgent)
        
        # Determine portal from path if not provided
        if not enriched_data.portal:
            enriched_data.portal = self._determine_portal(enriched_data.path)
        
        # Enrich with listing context
        if event_data.listingId:
            try:
                listing = await self.listings_collection.find_one(
                    {"_id": ObjectId(event_data.listingId)}
                )
                if listing:
                    # Try to get locality from location.locality (premium format) or locality (legacy)
                    enriched_data.locality = listing.get("location", {}).get("locality") or listing.get("locality")
                    enriched_data.city = listing.get("location", {}).get("city") or listing.get("city", "Delhi")
                    if not enriched_data.partnerId:
                        enriched_data.partnerId = listing.get("partnerId")
            except Exception:
                pass  # Invalid ObjectId or listing not found
        elif event_data.listingSlug:
            # Normalize slug format - ensure it starts with /listing/
            normalized_slug = event_data.listingSlug
            if not normalized_slug.startswith('/listing/'):
                normalized_slug = f"/listing/{normalized_slug.lstrip('/')}"
            
            # Try to find listing by slug with multiple strategies
            listing = None
            try:
                # Strategy 1: Exact match with normalized slug
                listing = await self.listings_collection.find_one(
                    {"slugData.slug": normalized_slug}
                )
                
                # Strategy 2: Try original slug format if normalized didn't match
                if not listing and event_data.listingSlug != normalized_slug:
                    listing = await self.listings_collection.find_one(
                        {"slugData.slug": event_data.listingSlug}
                    )
                
                # Strategy 3: Try without /listing/ prefix (fallback)
                if not listing:
                    slug_without_prefix = normalized_slug.replace('/listing/', '', 1).lstrip('/')
                    listing = await self.listings_collection.find_one(
                        {"slugData.slug": {"$regex": f"^/listing/{slug_without_prefix}$", "$options": "i"}}
                    )
                
                if listing:
                    enriched_data.listingId = str(listing["_id"])
                    enriched_data.locality = listing.get("location", {}).get("locality") or listing.get("locality")
                    enriched_data.city = listing.get("location", {}).get("city") or listing.get("city", "Delhi")
                    if not enriched_data.partnerId:
                        partner_id = listing.get("partnerId")
                        if partner_id:
                            enriched_data.partnerId = str(partner_id) if not isinstance(partner_id, str) else partner_id
                    
                    # Debug logging (dev mode only)
                    import os
                    if os.getenv("DEBUG", "False").lower() == "true" or os.getenv("APP_ENV", "").lower() in ["dev", "development"]:
                        print(f"[Analytics] Enriched event with listing: slug={normalized_slug}, listingId={enriched_data.listingId}, partnerId={enriched_data.partnerId}")
                else:
                    # Debug logging for failed matches
                    import os
                    if os.getenv("DEBUG", "False").lower() == "true" or os.getenv("APP_ENV", "").lower() in ["dev", "development"]:
                        print(f"[Analytics] Warning: Could not find listing for slug: {event_data.listingSlug} (normalized: {normalized_slug})")
            except Exception as e:
                # Debug logging for errors
                import os
                if os.getenv("DEBUG", "False").lower() == "true" or os.getenv("APP_ENV", "").lower() in ["dev", "development"]:
                    print(f"[Analytics] Error enriching event with slug {event_data.listingSlug}: {e}")
                pass
        
        return enriched_data
    
    def _extract_domain(self, url: str) -> Optional[str]:
        """Extract domain from URL."""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc
            # Remove port if present
            if ':' in domain:
                domain = domain.split(':')[0]
            return domain.lower() if domain else None
        except Exception:
            return None
    
    def _detect_device_type(self, user_agent: str) -> str:
        """Detect device type from user agent."""
        if not user_agent:
            return "unknown"
        
        ua_lower = user_agent.lower()
        
        # Mobile detection
        mobile_indicators = ['mobile', 'android', 'iphone', 'ipod', 'blackberry', 'windows phone']
        if any(indicator in ua_lower for indicator in mobile_indicators):
            return "mobile"
        
        # Tablet detection
        tablet_indicators = ['tablet', 'ipad', 'playbook']
        if any(indicator in ua_lower for indicator in tablet_indicators):
            return "tablet"
        
        # Default to desktop
        return "desktop"
    
    def _determine_portal(self, path: str) -> str:
        """Determine portal type from path."""
        if path.startswith('/admin'):
            return "admin"
        elif path.startswith('/partner'):
            return "partner"
        else:
            return "public"
    
    async def _get_top_listings(
        self, 
        start_date: datetime, 
        end_date: datetime,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Get top performing listings by views and enquiries."""
        # Match events with listingId or listingSlug
        pipeline = [
            {
                "$match": {
                    "timestamp": {"$gte": start_date, "$lte": end_date},
                    "eventName": {"$in": [EventName.LISTING_VIEW, EventName.ENQUIRY_SUBMIT]},
                    "$or": [
                        {"listingId": {"$exists": True, "$ne": None}},
                        {"listingSlug": {"$exists": True, "$ne": None}}
                    ]
                }
            },
            {
                "$group": {
                    "_id": {
                        "listingId": "$listingId",
                        "listingSlug": "$listingSlug",
                        "eventName": "$eventName"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        listing_stats = {}
        async for doc in self.events_collection.aggregate(pipeline):
            listing_id = doc["_id"].get("listingId")
            listing_slug = doc["_id"].get("listingSlug")
            event_name = doc["_id"]["eventName"]
            count = doc["count"]
            
            # Use listingId as key if available, otherwise use slug
            key = listing_id or listing_slug
            if not key:
                continue
                
            if key not in listing_stats:
                listing_stats[key] = {
                    "listingId": listing_id,
                    "listingSlug": listing_slug,
                    "views": 0,
                    "enquiries": 0
                }
            
            if event_name == EventName.LISTING_VIEW:
                listing_stats[key]["views"] += count
            elif event_name == EventName.ENQUIRY_SUBMIT:
                listing_stats[key]["enquiries"] += count
        
        # Get listing details and combine with stats
        top_listings = []
        for key, stats in listing_stats.items():
            try:
                listing = None
                
                # Try to find listing by ID first
                if stats["listingId"]:
                    try:
                        listing = await self.listings_collection.find_one(
                            {"_id": ObjectId(stats["listingId"])}
                        )
                    except Exception:
                        pass
                
                # If not found by ID, try by slug
                if not listing and stats["listingSlug"]:
                    listing = await self.listings_collection.find_one(
                        {"slugData.slug": stats["listingSlug"]}
                    )
                
                if listing:
                    conversion_rate = (stats["enquiries"] / stats["views"] * 100) if stats["views"] > 0 else 0.0
                    
                    top_listings.append({
                        "listingId": str(listing["_id"]) if listing.get("_id") else stats["listingId"],
                        "displayName": listing.get("displayName", "Unknown"),
                        "views": stats["views"],
                        "enquiries": stats["enquiries"],
                        "conversionRate": round(conversion_rate, 2)
                    })
            except Exception as e:
                # Log error in development but continue processing
                import logging
                logger = logging.getLogger(__name__)
                logger.debug(f"Error processing listing {key}: {e}")
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
    
    async def get_time_series(
        self,
        start_date: datetime,
        end_date: datetime,
        partner_id: Optional[str] = None,
        listing_id: Optional[str] = None,
        granularity: str = "day",  # "day", "week", "month"
        metrics: Optional[List[str]] = None  # ["views", "clicks", "enquiries", "whatsapp", "calls", "emails"]
    ) -> AnalyticsTimeSeries:
        """Get time-series data for charts."""
        # Build match filter - partner filtering will be done in post-processing
        match_filter = {
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }
        # Note: partner_id filtering is handled in post-processing to support events without partnerId
        if listing_id:
            match_filter["listingId"] = listing_id
        
        # Determine date truncation unit
        date_trunc_unit = granularity
        
        # Group by date and event type (include partnerId/listingId for filtering)
        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": {
                        "date": {
                            "$dateToString": {
                                "format": "%Y-%m-%d" if granularity == "day" else ("%Y-%U" if granularity == "week" else "%Y-%m"),
                                "date": "$timestamp"
                            }
                        },
                        "eventName": "$eventName",
                        "partnerId": "$partnerId",
                        "listingId": "$listingId",
                        "listingSlug": "$listingSlug"
                    },
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id.date": 1}}
        ]
        
        # Execute aggregation
        cursor = self.events_collection.aggregate(pipeline)
        results = await cursor.to_list(length=None)
        
        # Transform to time-series format with partner filtering
        date_map: Dict[str, Dict[str, int]] = {}
        
        for doc in results:
            date_str = doc["_id"]["date"]
            event_name = doc["_id"]["eventName"]
            event_partner_id = doc["_id"].get("partnerId")
            listing_id = doc["_id"].get("listingId")
            listing_slug = doc["_id"].get("listingSlug")
            count = doc["count"]
            
            # Filter by partner_id if provided
            if partner_id:
                belongs_to_partner = False
                
                # Direct partnerId match
                if event_partner_id and str(event_partner_id) == str(partner_id):
                    belongs_to_partner = True
                
                # If no direct match, try to resolve from listing
                if not belongs_to_partner and (listing_id or listing_slug):
                    try:
                        listing = None
                        if listing_id:
                            try:
                                listing = await self.listings_collection.find_one({"_id": ObjectId(listing_id)})
                            except Exception:
                                pass
                        
                        if not listing and listing_slug:
                            normalized_slug = listing_slug if listing_slug.startswith('/listing/') else f"/listing/{listing_slug.lstrip('/')}"
                            listing = await self.listings_collection.find_one({"slugData.slug": normalized_slug})
                        
                        if listing:
                            listing_partner_id = listing.get("partnerId")
                            if listing_partner_id:
                                listing_partner_id_str = str(listing_partner_id) if not isinstance(listing_partner_id, str) else listing_partner_id
                                if listing_partner_id_str == str(partner_id):
                                    belongs_to_partner = True
                    except Exception:
                        pass
                
                if not belongs_to_partner:
                    continue
            
            if date_str not in date_map:
                date_map[date_str] = {"views": 0, "enquiries": 0, "searches": 0, "clicks": 0, "whatsapp": 0, "calls": 0, "emails": 0}
            
            # Map event names to metrics
            # Normalize listing_card_click to listing_click
            if event_name == EventName.LISTING_CARD_CLICK:
                event_name = EventName.LISTING_CLICK
            
            if event_name in [EventName.LISTING_VIEW, EventName.PAGE_VIEW]:
                date_map[date_str]["views"] += count
            elif event_name == EventName.ENQUIRY_SUBMIT:
                date_map[date_str]["enquiries"] += count
            elif event_name in [EventName.SEARCH_PERFORMED, EventName.EXPLORE_SEARCH]:
                date_map[date_str]["searches"] += count
            elif event_name == EventName.LISTING_CLICK:
                date_map[date_str]["clicks"] += count
            elif event_name == EventName.WHATSAPP_CLICK:
                date_map[date_str]["whatsapp"] = date_map[date_str].get("whatsapp", 0) + count
            elif event_name == EventName.CALL_CLICK:
                date_map[date_str]["calls"] = date_map[date_str].get("calls", 0) + count
            elif event_name == EventName.EMAIL_CLICK:
                date_map[date_str]["emails"] = date_map[date_str].get("emails", 0) + count
        
        # Convert to list of TimeSeriesDataPoint
        data_points = []
        for date_str, metrics in sorted(date_map.items()):
            # Parse date string back to datetime
            try:
                if granularity == "day":
                    date_obj = datetime.strptime(date_str, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                elif granularity == "week":
                    year, week = date_str.split("-")
                    # Approximate: first day of week
                    date_obj = datetime.strptime(f"{year}-W{week}-1", "%Y-W%W-%w").replace(tzinfo=timezone.utc)
                else:  # month
                    date_obj = datetime.strptime(date_str, "%Y-%m").replace(tzinfo=timezone.utc)
            except Exception:
                continue
            
            data_points.append(TimeSeriesDataPoint(
                date=date_obj,
                views=metrics.get("views", 0),
                enquiries=metrics.get("enquiries", 0),
                searches=metrics.get("searches", 0),
                clicks=metrics.get("clicks", 0),
                whatsapp=metrics.get("whatsapp", 0),
                calls=metrics.get("calls", 0),
                emails=metrics.get("emails", 0)
            ))
        
        return AnalyticsTimeSeries(
            dataPoints=data_points,
            startDate=start_date,
            endDate=end_date
        )
    
    async def get_conversion_funnel(
        self,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, int]:
        """Calculate conversion funnel metrics."""
        # Match filter
        match_filter = {}
        if start_date:
            match_filter["timestamp"] = {"$gte": start_date}
        if end_date:
            if "timestamp" in match_filter:
                match_filter["timestamp"]["$lte"] = end_date
            else:
                match_filter["timestamp"] = {"$lte": end_date}
        
        # Aggregate by event type
        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": "$eventName",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        event_counts = {}
        async for doc in self.events_collection.aggregate(pipeline):
            event_counts[doc["_id"]] = doc["count"]
        
        # Map to funnel stages
        funnel = {
            "page_views": event_counts.get(EventName.PAGE_VIEW, 0),
            "listing_views": event_counts.get(EventName.LISTING_VIEW, 0),
            "enquiries": event_counts.get(EventName.ENQUIRY_SUBMIT, 0),
            "whatsapp_clicks": event_counts.get(EventName.WHATSAPP_CLICK, 0),
            "call_clicks": event_counts.get(EventName.CALL_CLICK, 0),
            "email_clicks": event_counts.get(EventName.EMAIL_CLICK, 0)
        }
        
        return funnel
    
    async def get_analytics_overview(
        self,
        start_date: datetime,
        end_date: datetime,
        partner_id: Optional[str] = None
    ) -> AnalyticsOverview:
        """Get analytics overview with period comparison."""
        # Calculate previous period (same duration)
        period_duration = end_date - start_date
        previous_end = start_date
        previous_start = previous_end - period_duration
        
        # Build match filter - if partner_id is provided, match by partnerId OR by listingId (then filter by partner)
        match_filter_current = {
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }
        match_filter_previous = {
            "timestamp": {"$gte": previous_start, "$lte": previous_end}
        }
        
        # For partner filtering, we'll handle it in post-processing to support events without partnerId
        # but with listingId that belongs to the partner
        
        # Aggregate current period metrics
        # If partner_id is provided, we need to filter events that belong to this partner
        # This includes events with partnerId matching OR events with listingId belonging to this partner
        pipeline_current = [
            {"$match": match_filter_current},
            {
                "$group": {
                    "_id": {
                        "eventName": "$eventName",
                        "partnerId": "$partnerId",
                        "listingId": "$listingId",
                        "listingSlug": "$listingSlug"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        current_stats = {}
        async for doc in self.events_collection.aggregate(pipeline_current):
            event_name = doc["_id"]["eventName"]
            event_partner_id = doc["_id"].get("partnerId")
            listing_id = doc["_id"].get("listingId")
            listing_slug = doc["_id"].get("listingSlug")
            
            # Filter by partner_id if provided
            if partner_id:
                # Check if event belongs to this partner
                belongs_to_partner = False
                
                # Direct partnerId match
                if event_partner_id:
                    # Handle both string and ObjectId formats
                    if str(event_partner_id) == str(partner_id):
                        belongs_to_partner = True
                
                # If no direct match, try to resolve from listing
                if not belongs_to_partner and (listing_id or listing_slug):
                    try:
                        listing = None
                        if listing_id:
                            try:
                                listing = await self.listings_collection.find_one({"_id": ObjectId(listing_id)})
                            except Exception:
                                pass
                        
                        if not listing and listing_slug:
                            normalized_slug = listing_slug if listing_slug.startswith('/listing/') else f"/listing/{listing_slug.lstrip('/')}"
                            listing = await self.listings_collection.find_one({"slugData.slug": normalized_slug})
                        
                        if listing:
                            listing_partner_id = listing.get("partnerId")
                            if listing_partner_id:
                                listing_partner_id_str = str(listing_partner_id) if not isinstance(listing_partner_id, str) else listing_partner_id
                                if listing_partner_id_str == str(partner_id):
                                    belongs_to_partner = True
                    except Exception:
                        pass
                
                if not belongs_to_partner:
                    continue
            
            # Normalize listing_card_click to listing_click
            if event_name == EventName.LISTING_CARD_CLICK:
                event_name = EventName.LISTING_CLICK
            
            current_stats[event_name] = current_stats.get(event_name, 0) + doc["count"]
        
        # Aggregate previous period metrics
        pipeline_previous = [
            {"$match": match_filter_previous},
            {
                "$group": {
                    "_id": {
                        "eventName": "$eventName",
                        "partnerId": "$partnerId",
                        "listingId": "$listingId",
                        "listingSlug": "$listingSlug"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        previous_stats = {}
        async for doc in self.events_collection.aggregate(pipeline_previous):
            event_name = doc["_id"]["eventName"]
            event_partner_id = doc["_id"].get("partnerId")
            listing_id = doc["_id"].get("listingId")
            listing_slug = doc["_id"].get("listingSlug")
            
            # Filter by partner_id if provided
            if partner_id:
                # Check if event belongs to this partner
                belongs_to_partner = False
                
                # Direct partnerId match
                if event_partner_id:
                    if str(event_partner_id) == str(partner_id):
                        belongs_to_partner = True
                
                # If no direct match, try to resolve from listing
                if not belongs_to_partner and (listing_id or listing_slug):
                    try:
                        listing = None
                        if listing_id:
                            try:
                                listing = await self.listings_collection.find_one({"_id": ObjectId(listing_id)})
                            except Exception:
                                pass
                        
                        if not listing and listing_slug:
                            normalized_slug = listing_slug if listing_slug.startswith('/listing/') else f"/listing/{listing_slug.lstrip('/')}"
                            listing = await self.listings_collection.find_one({"slugData.slug": normalized_slug})
                        
                        if listing:
                            listing_partner_id = listing.get("partnerId")
                            if listing_partner_id:
                                listing_partner_id_str = str(listing_partner_id) if not isinstance(listing_partner_id, str) else listing_partner_id
                                if listing_partner_id_str == str(partner_id):
                                    belongs_to_partner = True
                    except Exception:
                        pass
                
                if not belongs_to_partner:
                    continue
            
            # Normalize listing_card_click to listing_click
            if event_name == EventName.LISTING_CARD_CLICK:
                event_name = EventName.LISTING_CLICK
            
            previous_stats[event_name] = previous_stats.get(event_name, 0) + doc["count"]
        
        # Calculate metrics
        def calculate_period_comparison(current_val: int, previous_val: int) -> PeriodComparison:
            if previous_val == 0:
                change = 100.0 if current_val > 0 else 0.0
                trend = "up" if current_val > 0 else "neutral"
            else:
                change = ((current_val - previous_val) / previous_val) * 100
                trend = "up" if change > 0 else ("down" if change < 0 else "neutral")
            return PeriodComparison(
                current=current_val,
                previous=previous_val,
                change=round(change, 2),
                trend=trend
            )
        
        views_current = current_stats.get(EventName.LISTING_VIEW, 0)
        views_previous = previous_stats.get(EventName.LISTING_VIEW, 0)
        
        clicks_current = current_stats.get(EventName.LISTING_CLICK, 0) + current_stats.get(EventName.LISTING_CARD_CLICK, 0)
        clicks_previous = previous_stats.get(EventName.LISTING_CLICK, 0) + previous_stats.get(EventName.LISTING_CARD_CLICK, 0)
        
        enquiries_current = current_stats.get(EventName.ENQUIRY_SUBMIT, 0)
        enquiries_previous = previous_stats.get(EventName.ENQUIRY_SUBMIT, 0)
        
        whatsapp_current = current_stats.get(EventName.WHATSAPP_CLICK, 0)
        whatsapp_previous = previous_stats.get(EventName.WHATSAPP_CLICK, 0)
        
        call_current = current_stats.get(EventName.CALL_CLICK, 0)
        call_previous = previous_stats.get(EventName.CALL_CLICK, 0)
        
        email_current = current_stats.get(EventName.EMAIL_CLICK, 0)
        email_previous = previous_stats.get(EventName.EMAIL_CLICK, 0)
        
        # Calculate conversion rates
        click_to_enquiry = (enquiries_current / clicks_current * 100) if clicks_current > 0 else 0.0
        view_to_enquiry = (enquiries_current / views_current * 100) if views_current > 0 else 0.0
        whatsapp_share = (whatsapp_current / enquiries_current * 100) if enquiries_current > 0 else 0.0
        
        return AnalyticsOverview(
            views=calculate_period_comparison(views_current, views_previous),
            clicks=calculate_period_comparison(clicks_current, clicks_previous),
            enquiries=calculate_period_comparison(enquiries_current, enquiries_previous),
            whatsappClicks=calculate_period_comparison(whatsapp_current, whatsapp_previous),
            callClicks=calculate_period_comparison(call_current, call_previous),
            emailClicks=calculate_period_comparison(email_current, email_previous),
            clickToEnquiryRate=round(click_to_enquiry, 2),
            viewToEnquiryRate=round(view_to_enquiry, 2),
            whatsappShareRate=round(whatsapp_share, 2),
            currentPeriodStart=start_date,
            currentPeriodEnd=end_date,
            previousPeriodStart=previous_start,
            previousPeriodEnd=previous_end
        )
    
    async def get_top_workspaces(
        self,
        start_date: datetime,
        end_date: datetime,
        limit: int = 10,
        partner_id: Optional[str] = None
    ) -> List[TopWorkspace]:
        """Get top performing workspaces (partners)."""
        # Match events with listing context (either partnerId or listingId)
        match_filter = {
            "timestamp": {"$gte": start_date, "$lte": end_date},
            "eventName": {"$in": [EventName.LISTING_VIEW, EventName.ENQUIRY_SUBMIT]},
            "$or": [
                {"partnerId": {"$exists": True, "$ne": None}},
                {"listingId": {"$exists": True, "$ne": None}},
                {"listingSlug": {"$exists": True, "$ne": None}}
            ]
        }
        
        if partner_id:
            match_filter["partnerId"] = partner_id
        
        # Aggregate by partner (from partnerId or from listingId)
        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": {
                        "partnerId": "$partnerId",
                        "listingId": "$listingId",
                        "listingSlug": "$listingSlug",
                        "eventName": "$eventName"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        # Collect stats by partner
        partner_stats = {}
        async for doc in self.events_collection.aggregate(pipeline):
            event_name = doc["_id"]["eventName"]
            # Normalize listing_card_click to listing_click
            if event_name == EventName.LISTING_CARD_CLICK:
                event_name = EventName.LISTING_CLICK
            
            # Try to get partnerId from event or resolve from listing
            partner_id_from_event = doc["_id"].get("partnerId")
            listing_id = doc["_id"].get("listingId")
            listing_slug = doc["_id"].get("listingSlug")
            
            # If no partnerId, try to resolve from listing
            if not partner_id_from_event and (listing_id or listing_slug):
                try:
                    listing = None
                    if listing_id:
                        try:
                            listing = await self.listings_collection.find_one({"_id": ObjectId(listing_id)})
                        except Exception:
                            pass
                    
                    if not listing and listing_slug:
                        normalized_slug = listing_slug if listing_slug.startswith('/listing/') else f"/listing/{listing_slug.lstrip('/')}"
                        listing = await self.listings_collection.find_one({"slugData.slug": normalized_slug})
                    
                    if listing:
                        partner_id_from_event = listing.get("partnerId")
                        if partner_id_from_event:
                            partner_id_from_event = str(partner_id_from_event) if not isinstance(partner_id_from_event, str) else partner_id_from_event
                except Exception:
                    pass
            
            if not partner_id_from_event:
                continue
            
            # Filter by partner_id if specified
            if partner_id and partner_id_from_event != partner_id:
                continue
            
            if partner_id_from_event not in partner_stats:
                partner_stats[partner_id_from_event] = {"views": 0, "enquiries": 0}
            
            if event_name == EventName.LISTING_VIEW:
                partner_stats[partner_id_from_event]["views"] += doc["count"]
            elif event_name == EventName.ENQUIRY_SUBMIT:
                partner_stats[partner_id_from_event]["enquiries"] += doc["count"]
        
        # Get partner details
        top_workspaces = []
        for partner_id_str, stats in partner_stats.items():
            if stats["views"] == 0 and stats["enquiries"] == 0:
                continue
                
            try:
                partner_obj_id = ObjectId(partner_id_str)
                partner = await self.partners_collection.find_one({"_id": partner_obj_id})
                
                conversion_rate = (stats["enquiries"] / stats["views"] * 100) if stats["views"] > 0 else 0.0
                
                top_workspaces.append(TopWorkspace(
                    partnerId=partner_id_str,
                    workspaceBrandName=partner.get("workspaceBrandName") if partner else None,
                    views=stats["views"],
                    enquiries=stats["enquiries"],
                    conversionRate=round(conversion_rate, 2)
                ))
            except Exception:
                # Skip invalid partner IDs
                continue
        
        # Sort by views and limit
        top_workspaces.sort(key=lambda x: x.views, reverse=True)
        return top_workspaces[:limit]
    
    async def get_top_localities(
        self,
        start_date: datetime,
        end_date: datetime,
        limit: int = 10,
        partner_id: Optional[str] = None
    ) -> List[TopLocality]:
        """Get top performing localities."""
        # Match events with listing context (either locality or listingId to resolve locality)
        match_filter = {
            "timestamp": {"$gte": start_date, "$lte": end_date},
            "eventName": {"$in": [EventName.LISTING_VIEW, EventName.ENQUIRY_SUBMIT]},
            "$or": [
                {"locality": {"$exists": True, "$ne": None}},
                {"listingId": {"$exists": True, "$ne": None}},
                {"listingSlug": {"$exists": True, "$ne": None}}
            ]
        }
        
        # Note: partner_id filtering is handled in post-processing
        
        # Aggregate by locality (from event or resolved from listing)
        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": {
                        "locality": "$locality",
                        "city": "$city",
                        "listingId": "$listingId",
                        "listingSlug": "$listingSlug",
                        "eventName": "$eventName",
                        "partnerId": "$partnerId"
                    },
                    "count": {"$sum": 1}
                }
            }
        ]
        
        locality_stats = {}
        async for doc in self.events_collection.aggregate(pipeline):
            event_name = doc["_id"]["eventName"]
            locality = doc["_id"].get("locality")
            city = doc["_id"].get("city")
            listing_id = doc["_id"].get("listingId")
            listing_slug = doc["_id"].get("listingSlug")
            event_partner_id = doc["_id"].get("partnerId")
            
            # Filter by partner_id if provided
            if partner_id:
                belongs_to_partner = False
                
                # Direct partnerId match
                if event_partner_id and str(event_partner_id) == str(partner_id):
                    belongs_to_partner = True
                
                # If no direct match, try to resolve from listing
                if not belongs_to_partner and (listing_id or listing_slug):
                    try:
                        listing = None
                        if listing_id:
                            try:
                                listing = await self.listings_collection.find_one({"_id": ObjectId(listing_id)})
                            except Exception:
                                pass
                        
                        if not listing and listing_slug:
                            normalized_slug = listing_slug if listing_slug.startswith('/listing/') else f"/listing/{listing_slug.lstrip('/')}"
                            listing = await self.listings_collection.find_one({"slugData.slug": normalized_slug})
                        
                        if listing:
                            listing_partner_id = listing.get("partnerId")
                            if listing_partner_id:
                                listing_partner_id_str = str(listing_partner_id) if not isinstance(listing_partner_id, str) else listing_partner_id
                                if listing_partner_id_str == str(partner_id):
                                    belongs_to_partner = True
                    except Exception:
                        pass
                
                if not belongs_to_partner:
                    continue
            
            # If no locality, try to resolve from listing
            if not locality and (listing_id or listing_slug):
                try:
                    listing = None
                    if listing_id:
                        try:
                            listing = await self.listings_collection.find_one({"_id": ObjectId(listing_id)})
                        except Exception:
                            pass
                    
                    if not listing and listing_slug:
                        normalized_slug = listing_slug if listing_slug.startswith('/listing/') else f"/listing/{listing_slug.lstrip('/')}"
                        listing = await self.listings_collection.find_one({"slugData.slug": normalized_slug})
                    
                    if listing:
                        locality = listing.get("location", {}).get("locality") or listing.get("locality")
                        if not city:
                            city = listing.get("location", {}).get("city") or listing.get("city", "Delhi")
                except Exception:
                    pass
            
            if not locality:
                continue
            
            if locality not in locality_stats:
                locality_stats[locality] = {
                    "city": city,
                    "views": 0,
                    "enquiries": 0
                }
            
            if event_name == EventName.LISTING_VIEW:
                locality_stats[locality]["views"] += doc["count"]
            elif event_name == EventName.ENQUIRY_SUBMIT:
                locality_stats[locality]["enquiries"] += doc["count"]
        
        # Convert to list and calculate conversion rates
        top_localities = []
        for locality, stats in locality_stats.items():
            if stats["views"] == 0 and stats["enquiries"] == 0:
                continue
                
            conversion_rate = (stats["enquiries"] / stats["views"] * 100) if stats["views"] > 0 else 0.0
            
            top_localities.append(TopLocality(
                locality=locality,
                city=stats["city"],
                views=stats["views"],
                enquiries=stats["enquiries"],
                conversionRate=round(conversion_rate, 2)
            ))
        
        # Sort by views and limit
        top_localities.sort(key=lambda x: x.views, reverse=True)
        return top_localities[:limit]
    
    async def get_enhanced_funnel(
        self,
        start_date: datetime,
        end_date: datetime,
        partner_id: Optional[str] = None
    ) -> ConversionFunnel:
        """Get enhanced conversion funnel with stages."""
        match_filter = {
            "timestamp": {"$gte": start_date, "$lte": end_date}
        }
        
        if partner_id:
            match_filter["partnerId"] = partner_id
        
        # Aggregate by event type
        pipeline = [
            {"$match": match_filter},
            {
                "$group": {
                    "_id": "$eventName",
                    "count": {"$sum": 1}
                }
            }
        ]
        
        event_counts = {}
        async for doc in self.events_collection.aggregate(pipeline):
            event_name = doc["_id"]
            # Normalize listing_card_click to listing_click
            if event_name == EventName.LISTING_CARD_CLICK:
                event_name = EventName.LISTING_CLICK
            event_counts[event_name] = doc["count"]
        
        # Calculate funnel stages
        views = event_counts.get(EventName.LISTING_VIEW, 0)
        clicks = event_counts.get(EventName.LISTING_CLICK, 0) + event_counts.get(EventName.LISTING_CARD_CLICK, 0)
        enquiries = event_counts.get(EventName.ENQUIRY_SUBMIT, 0)
        whatsapp = event_counts.get(EventName.WHATSAPP_CLICK, 0)
        calls = event_counts.get(EventName.CALL_CLICK, 0)
        total_whatsapp_calls = whatsapp + calls
        
        stages = []
        
        # Stage 1: Views
        stages.append(FunnelStage(
            stage="Views",
            count=views,
            conversionRate=100.0,
            dropOff=0
        ))
        
        # Stage 2: Clicks
        click_conversion = (clicks / views * 100) if views > 0 else 0.0
        click_dropoff = views - clicks
        stages.append(FunnelStage(
            stage="Clicks",
            count=clicks,
            conversionRate=round(click_conversion, 2),
            dropOff=click_dropoff
        ))
        
        # Stage 3: Enquiries
        enquiry_conversion = (enquiries / clicks * 100) if clicks > 0 else 0.0
        enquiry_dropoff = clicks - enquiries
        stages.append(FunnelStage(
            stage="Enquiries",
            count=enquiries,
            conversionRate=round(enquiry_conversion, 2),
            dropOff=enquiry_dropoff
        ))
        
        # Stage 4: WhatsApp/Call
        whatsapp_call_conversion = (total_whatsapp_calls / enquiries * 100) if enquiries > 0 else 0.0
        whatsapp_call_dropoff = enquiries - total_whatsapp_calls
        stages.append(FunnelStage(
            stage="WhatsApp/Call",
            count=total_whatsapp_calls,
            conversionRate=round(whatsapp_call_conversion, 2),
            dropOff=whatsapp_call_dropoff
        ))
        
        return ConversionFunnel(
            stages=stages,
            totalViews=views,
            totalClicks=clicks,
            totalEnquiries=enquiries,
            totalWhatsAppCalls=total_whatsapp_calls
        )
    
    async def get_analytics_insights(
        self,
        start_date: datetime,
        end_date: datetime,
        partner_id: Optional[str] = None
    ) -> AnalyticsInsights:
        """Get computed analytics insights."""
        insights = []
        
        # Get total metrics first for general insights
        overview = await self.get_analytics_overview(start_date, end_date, partner_id=partner_id)
        
        # Add insight about total activity if there's any
        total_activity = overview.views.current + overview.clicks.current + overview.enquiries.current
        if total_activity > 0:
            insights.append(Insight(
                type="activity_summary",
                message=f"Total activity: {overview.views.current} views, {overview.enquiries.current} enquiries in this period",
                value={
                    "views": overview.views.current,
                    "enquiries": overview.enquiries.current,
                    "clicks": overview.clicks.current
                }
            ))
        
        # Get top locality
        top_localities = await self.get_top_localities(start_date, end_date, limit=1, partner_id=partner_id)
        if top_localities and len(top_localities) > 0:
            best_locality = top_localities[0]
            if best_locality.views > 0:
                insights.append(Insight(
                    type="best_locality",
                    message=f"Best performing locality: {best_locality.locality} with {best_locality.views} views and {best_locality.enquiries} enquiries",
                    value={
                        "locality": best_locality.locality,
                        "views": best_locality.views,
                        "enquiries": best_locality.enquiries,
                        "conversionRate": best_locality.conversionRate
                    }
                ))
        
        # Get channel analysis (only if there are enquiries)
        if overview.enquiries.current > 0:
            match_filter = {
                "timestamp": {"$gte": start_date, "$lte": end_date},
                "eventName": EventName.ENQUIRY_SUBMIT,
                "referrerDomain": {"$exists": True, "$ne": None}
            }
            
            if partner_id:
                match_filter["partnerId"] = partner_id
            
            # Check referrer domain for enquiries
            pipeline = [
                {"$match": match_filter},
                {
                    "$group": {
                        "_id": "$referrerDomain",
                        "count": {"$sum": 1}
                    }
                },
                {"$sort": {"count": -1}},
                {"$limit": 1}
            ]
            
            top_referrer = None
            top_referrer_count = 0
            async for doc in self.events_collection.aggregate(pipeline):
                top_referrer = doc["_id"]
                top_referrer_count = doc["count"]
                break
            
            if top_referrer and top_referrer_count > 0:
                insights.append(Insight(
                    type="top_channel",
                    message=f"Most enquiries ({top_referrer_count}) come from {top_referrer}",
                    value={"channel": top_referrer, "count": top_referrer_count}
                ))
        
        # Add insight about conversion rate
        if overview.viewToEnquiryRate > 5.0:  # Above 5% is good
            insights.append(Insight(
                type="conversion_rate",
                message=f"Great conversion rate! {overview.viewToEnquiryRate:.1f}% of views convert to enquiries",
                value={"rate": overview.viewToEnquiryRate}
            ))
        elif overview.viewToEnquiryRate > 0:
            insights.append(Insight(
                type="conversion_rate",
                message=f"Current conversion rate: {overview.viewToEnquiryRate:.1f}% (views to enquiries)",
                value={"rate": overview.viewToEnquiryRate}
            ))
        
        # Add insight about engagement if clicks are high
        if overview.clicks.current > 0 and overview.views.current > 0:
            click_rate = (overview.clicks.current / overview.views.current * 100) if overview.views.current > 0 else 0
            if click_rate > 30:  # Above 30% click rate is good
                insights.append(Insight(
                    type="engagement",
                    message=f"High engagement! {click_rate:.1f}% of viewers click on listings",
                    value={"clickRate": click_rate}
                ))
            elif click_rate > 0:
                insights.append(Insight(
                    type="engagement",
                    message=f"Click-through rate: {click_rate:.1f}% (clicks per view)",
                    value={"clickRate": click_rate}
                ))
        
        # If no insights yet, add a helpful message
        if not insights and total_activity == 0:
            insights.append(Insight(
                type="no_data",
                message="No analytics data available for this period. Start tracking events to see insights.",
                value=None
            ))
        
        return AnalyticsInsights(insights=insights)


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