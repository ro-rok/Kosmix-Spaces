"""Create MongoDB indexes on startup."""
from app.db.mongodb import get_database


async def create_indexes():
    """Create all required indexes."""
    db = get_database()
    
    # Listings indexes (legacy)
    await db.listings.create_index("slug", unique=True)
    await db.listings.create_index("partnerId")
    await db.listings.create_index("verificationStatus")
    await db.listings.create_index("locality")
    await db.listings.create_index([("locality", 1), ("verificationStatus", 1)])
    
    # Premium listings indexes
    await db.premium_listings.create_index("slugData.slug", unique=True)
    await db.premium_listings.create_index("partnerId")
    await db.premium_listings.create_index("verificationStatus")
    await db.premium_listings.create_index("location.locality")
    await db.premium_listings.create_index("isPublished")
    await db.premium_listings.create_index([("location.locality", 1), ("verificationStatus", 1)])
    await db.premium_listings.create_index([("isPublished", 1), ("verificationStatus", 1)])
    await db.premium_listings.create_index([("partnerId", 1), ("updatedAt", -1)])
    await db.premium_listings.create_index("viewCount")
    await db.premium_listings.create_index("enquiryCount")
    await db.premium_listings.create_index("lastViewedAt")
    
    # Text search indexes for premium listings
    await db.premium_listings.create_index([
        ("displayName", "text"),
        ("overview", "text"),
        ("location.locality", "text"),
        ("amenities", "text")
    ])
    
    # Leads indexes
    await db.leads.create_index("phone")
    await db.leads.create_index([("phone", 1), ("createdAt", -1)])
    await db.leads.create_index("status")
    await db.leads.create_index("createdAt")
    
    # Site visits indexes
    await db.site_visits.create_index("leadId")
    await db.site_visits.create_index("status")
    await db.site_visits.create_index("createdAt")
    
    # Partners indexes
    await db.partners.create_index("email", unique=True)
    await db.partners.create_index("status")
    
    # Verifications indexes
    await db.verifications.create_index([("entityType", 1), ("entityId", 1)])
    await db.verifications.create_index("status")
    
    # Analytics indexes
    await db.analytics_events.create_index("eventId", unique=True)
    await db.analytics_events.create_index("timestamp")
    await db.analytics_events.create_index("eventName")
    await db.analytics_events.create_index("sessionId")
    await db.analytics_events.create_index("userRole")
    await db.analytics_events.create_index("listingId")
    await db.analytics_events.create_index("partnerId")
    await db.analytics_events.create_index("locality")
    await db.analytics_events.create_index([("eventName", 1), ("timestamp", -1)])
    await db.analytics_events.create_index([("listingId", 1), ("eventName", 1), ("timestamp", -1)])
    await db.analytics_events.create_index([("partnerId", 1), ("eventName", 1), ("timestamp", -1)])
    await db.analytics_events.create_index([("locality", 1), ("eventName", 1), ("timestamp", -1)])
    await db.analytics_events.create_index([("timestamp", -1), ("eventName", 1)])  # For time-based queries
