"""Create MongoDB indexes on startup."""
from app.db.mongodb import get_database


async def create_indexes():
    """Create all required indexes."""
    db = get_database()
    
    # Listings indexes
    await db.listings.create_index("slug", unique=True)
    await db.listings.create_index("partnerId")
    await db.listings.create_index("verificationStatus")
    await db.listings.create_index("locality")
    await db.listings.create_index([("locality", 1), ("verificationStatus", 1)])
    
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
