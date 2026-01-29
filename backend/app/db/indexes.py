"""Create MongoDB indexes on startup."""
import logging
from pymongo.errors import OperationFailure
from app.db.mongodb import get_database

logger = logging.getLogger(__name__)


async def safe_create_index(collection, keys, **kwargs):
    """Safely create an index, ignoring conflicts with existing indexes."""
    try:
        await collection.create_index(keys, **kwargs)
    except OperationFailure as e:
        if e.code == 86:  # IndexKeySpecsConflict
            logger.debug(f"Index already exists for {collection.name}: {keys}")
        else:
            logger.error(f"Failed to create index for {collection.name}: {e}")
            raise


async def create_indexes():
    """Create all required indexes."""
    db = get_database()
    
    # Listings indexes (legacy)
    await safe_create_index(db.listings, "slug", unique=True)
    await safe_create_index(db.listings, "partnerId")
    await safe_create_index(db.listings, "verificationStatus")
    await safe_create_index(db.listings, "locality")
    await safe_create_index(db.listings, [("locality", 1), ("verificationStatus", 1)])
    
    # Premium listings indexes
    await safe_create_index(db.premium_listings, "slugData.slug", unique=True)
    await safe_create_index(db.premium_listings, "partnerId")
    await safe_create_index(db.premium_listings, "verificationStatus")
    await safe_create_index(db.premium_listings, "location.locality")
    await safe_create_index(db.premium_listings, "isPublished")
    await safe_create_index(db.premium_listings, [("location.locality", 1), ("verificationStatus", 1)])
    await safe_create_index(db.premium_listings, [("isPublished", 1), ("verificationStatus", 1)])
    await safe_create_index(db.premium_listings, [("partnerId", 1), ("updatedAt", -1)])
    await safe_create_index(db.premium_listings, "viewCount")
    await safe_create_index(db.premium_listings, "enquiryCount")
    await safe_create_index(db.premium_listings, "lastViewedAt")
    
    # Text search indexes for premium listings
    await safe_create_index(db.premium_listings, [
        ("displayName", "text"),
        ("overview", "text"),
        ("location.locality", "text"),
        ("amenities", "text")
    ])
    
    # Leads indexes
    await safe_create_index(db.leads, "phone")
    await safe_create_index(db.leads, [("phone", 1), ("createdAt", -1)])
    await safe_create_index(db.leads, "status")
    await safe_create_index(db.leads, "createdAt")
    
    # Site visits indexes
    await safe_create_index(db.site_visits, "leadId")
    await safe_create_index(db.site_visits, "status")
    await safe_create_index(db.site_visits, "createdAt")
    
    # Partners indexes
    await safe_create_index(db.partners, "email", unique=True)
    await safe_create_index(db.partners, "status")
    
    # Cities indexes
    await safe_create_index(db.cities, "id", unique=True)
    await safe_create_index(db.cities, "name")
    
    # Localities indexes
    await safe_create_index(db.localities, "id", unique=True)
    await safe_create_index(db.localities, "cityId")
    await safe_create_index(db.localities, "status")
    await safe_create_index(db.localities, "name")
    await safe_create_index(db.localities, [("cityId", 1), ("status", 1), ("name", 1)])
    await safe_create_index(db.localities, [("name", 1), ("cityId", 1)], unique=True)  # Prevent duplicates
    await safe_create_index(db.localities, [("popular", -1), ("listingCount", -1)])
    
    # Verifications indexes
    await safe_create_index(db.verifications, [("entityType", 1), ("entityId", 1)])
    await safe_create_index(db.verifications, "status")
    
    # Analytics indexes
    await safe_create_index(db.analytics_events, "eventId", unique=True)
    await safe_create_index(db.analytics_events, "timestamp")
    await safe_create_index(db.analytics_events, "eventName")
    await safe_create_index(db.analytics_events, "sessionId")
    await safe_create_index(db.analytics_events, "userRole")
    await safe_create_index(db.analytics_events, "listingId")
    await safe_create_index(db.analytics_events, "listingSlug")
    await safe_create_index(db.analytics_events, "partnerId")
    await safe_create_index(db.analytics_events, "locality")
    await safe_create_index(db.analytics_events, "path")
    await safe_create_index(db.analytics_events, "portal")
    await safe_create_index(db.analytics_events, "referrerDomain")
    await safe_create_index(db.analytics_events, "utmSource")
    await safe_create_index(db.analytics_events, "utmCampaign")
    await safe_create_index(db.analytics_events, "deviceType")
    # Composite indexes for common query patterns
    await safe_create_index(db.analytics_events, [("timestamp", -1), ("eventName", 1)])
    await safe_create_index(db.analytics_events, [("timestamp", -1), ("eventName", 1), ("portal", 1)])
    await safe_create_index(db.analytics_events, [("portal", 1), ("timestamp", -1)])
    await safe_create_index(db.analytics_events, [("sessionId", 1), ("timestamp", -1)])
    await safe_create_index(db.analytics_events, [("listingId", 1), ("timestamp", -1)])
    await safe_create_index(db.analytics_events, [("listingSlug", 1), ("eventName", 1)])
    await safe_create_index(db.analytics_events, [("partnerId", 1), ("timestamp", -1)])
    await safe_create_index(db.analytics_events, [("userRole", 1), ("timestamp", -1)])
    await safe_create_index(db.analytics_events, [("path", 1), ("timestamp", -1)])
    await safe_create_index(db.analytics_events, [("listingId", 1), ("eventName", 1), ("timestamp", -1)])
    await safe_create_index(db.analytics_events, [("partnerId", 1), ("eventName", 1), ("timestamp", -1)])
    await safe_create_index(db.analytics_events, [("locality", 1), ("eventName", 1), ("timestamp", -1)])
    await safe_create_index(db.analytics_events, [("eventName", 1), ("timestamp", -1), ("portal", 1)])
    await safe_create_index(db.analytics_events, [("utmSource", 1), ("utmCampaign", 1), ("timestamp", -1)])
    
    # Optimized compound indexes for analytics queries (using timestamp field, not createdAt)
    # Note: analytics_events uses 'timestamp' field, not 'createdAt'
    await safe_create_index(db.analytics_events, [("eventName", 1), ("timestamp", -1)])  # Event-based time queries
    await safe_create_index(db.analytics_events, [("listingId", 1), ("timestamp", -1)])  # Listing analytics (already exists, but ensure it's there)
    await safe_create_index(db.analytics_events, [("partnerId", 1), ("timestamp", -1)])  # Partner analytics (already exists)
    await safe_create_index(db.analytics_events, [("locality", 1), ("timestamp", -1)])  # Locality analytics
    await safe_create_index(db.analytics_events, [("eventName", 1), ("partnerId", 1), ("timestamp", -1)])  # Partner event queries

    # Design system indexes
    await safe_create_index(db.design_system_config, "environment", unique=True)
    await safe_create_index(db.design_system_config, "version")
    await safe_create_index(db.design_system_config, "updatedAt")
    
    # User design preferences indexes
    await safe_create_index(db.user_design_preferences, [("userId", 1), ("userType", 1)], unique=True)
    await safe_create_index(db.user_design_preferences, "userType")
    await safe_create_index(db.user_design_preferences, "lastDevice")
    await safe_create_index(db.user_design_preferences, "updatedAt")
    await safe_create_index(db.user_design_preferences, "preferences.theme")
    await safe_create_index(db.user_design_preferences, "preferences.animationLevel")
    await safe_create_index(db.user_design_preferences, "preferences.highContrast")
    await safe_create_index(db.user_design_preferences, "preferences.reduceMotion")
    
    # Design system analytics indexes
    await safe_create_index(db.design_system_analytics, "timestamp")
    await safe_create_index(db.design_system_analytics, [("timestamp", -1)])  # For cleanup queries
    await safe_create_index(db.design_system_analytics, "cssLoadTime")
    await safe_create_index(db.design_system_analytics, "renderTime")
    await safe_create_index(db.design_system_analytics, "accessibilityScore")
    
    # Design system metrics indexes
    await safe_create_index(db.design_system_metrics, "type", unique=True)
    await safe_create_index(db.design_system_metrics, "lastUpdated")
