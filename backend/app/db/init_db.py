"""Database initialization and seeding utilities."""
import asyncio
from datetime import datetime
from typing import List, Dict, Any
from bson import ObjectId
from passlib.context import CryptContext

from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection
from app.db.indexes import create_indexes
from app.core.config import get_settings

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
settings = get_settings()


async def init_database():
    """Initialize database with indexes and seed data."""
    print("🔄 Connecting to MongoDB...")
    await connect_to_mongo()
    
    print("🔄 Creating indexes...")
    await create_indexes()
    
    print("🔄 Seeding initial data...")
    await seed_initial_data()
    
    print("✅ Database initialization complete!")


async def seed_initial_data():
    """Seed database with initial data for development."""
    db = get_database()
    
    # Create admin user if not exists
    admin_exists = await db.admins.find_one({"email": settings.ADMIN_EMAIL})
    if not admin_exists:
        admin_doc = {
            "_id": ObjectId(),
            "email": settings.ADMIN_EMAIL,
            "passwordHash": settings.ADMIN_PASSWORD_HASH,
            "role": "SUPER_ADMIN",
            "status": "ACTIVE",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        await db.admins.insert_one(admin_doc)
        print(f"✅ Created admin user: {settings.ADMIN_EMAIL}")
    
    # Seed sample partner if in dev environment
    if settings.APP_ENV == "dev":
        await seed_dev_data(db)


async def seed_dev_data(db):
    """Seed development data."""
    # Create sample partner
    partner_exists = await db.partners.find_one({"email": "partner@example.com"})
    if not partner_exists:
        partner_doc = {
            "_id": ObjectId(),
            "workspaceBrandName": "Demo Workspace",
            "contactName": "John Doe",
            "phone": "+919876543210",
            "email": "partner@example.com",
            "passwordHash": pwd_context.hash("password123"),
            "status": "ACTIVE",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        partner_result = await db.partners.insert_one(partner_doc)
        partner_id = partner_result.inserted_id
        print("✅ Created sample partner")
        
        # Create sample listing
        listing_doc = {
            "_id": ObjectId(),
            "slug": f"demo-workspace-connaught-place-{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
            "partnerId": partner_id,
            "displayName": "Demo Workspace - Connaught Place",
            "brandHidden": False,
            "locality": "Connaught Place",
            "city": "Delhi",
            "exactAddress": "123 Demo Street, Connaught Place, New Delhi - 110001",
            "workspaceTypes": ["DEDICATED_DESKS", "MEETING_ROOMS_ADDON"],
            "photos": [
                {
                    "url": "https://res.cloudinary.com/demo/image/upload/v1/sample.jpg",
                    "publicId": "sample",
                    "width": 800,
                    "height": 600,
                    "bytes": 150000,
                    "format": "jpg"
                }
            ],
            "seatCapacity": {
                "minSeats": 5,
                "maxSeats": 20
            },
            "availabilityStatus": "AVAILABLE",
            "budgetBandId": "15k-25k",
            "budgetDisplayText": "₹15,000 - ₹25,000 per seat/month",
            "pricingMode": "ON_ENQUIRY",
            "nearMetro": True,
            "metroNote": "2 minutes walk from Rajiv Chowk Metro",
            "parking": "BOTH",
            "powerBackup": True,
            "gstInvoiceAvailable": True,
            "accessHours": "24/7",
            "weekendAccess": True,
            "amenities": [
                "High Speed Internet",
                "Air Conditioning",
                "Tea/Coffee",
                "Reception",
                "Security",
                "Housekeeping"
            ],
            "meetingRooms": {
                "count": 2,
                "addonOnly": True
            },
            "internetSpeedMbps": 100,
            "dealTags": ["EARLY_BIRD", "FLEXIBLE_TERMS"],
            "dealDetails": "20% off on first 3 months",
            "dealEligibility": "Valid for new customers only",
            "overview": "Premium workspace in the heart of Delhi with modern amenities and flexible seating options.",
            "houseRules": "No smoking, maintain cleanliness, respect other members",
            "verificationStatus": "APPROVED_VERIFIED",
            "publishedAt": datetime.utcnow(),
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        await db.listings.insert_one(listing_doc)
        print("✅ Created sample listing")
        
        # Create sample lead
        lead_doc = {
            "_id": ObjectId(),
            "name": "Jane Smith",
            "phone": "+919876543211",
            "email": "jane@example.com",
            "company": "Tech Startup Inc",
            "teamSizeBand": "6-15",
            "preferredLocalities": ["Connaught Place", "Gurgaon"],
            "budgetBandId": "15k-25k",
            "spaceType": "DEDICATED_DESKS",
            "moveInTimeframe": "WITHIN_MONTH",
            "meetingRoomsAddon": True,
            "gstInvoiceRequired": True,
            "parkingNeeded": True,
            "powerBackupRequired": True,
            "nearMetroPreferred": True,
            "notes": "Looking for a modern workspace for our growing team",
            "source": "WEBSITE",
            "listingSlug": listing_doc["slug"],
            "status": "NEW",
            "priority": "NORMAL",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        await db.leads.insert_one(lead_doc)
        print("✅ Created sample lead")


async def reset_database():
    """Reset database - WARNING: This will delete all data!"""
    print("⚠️  WARNING: This will delete ALL data!")
    confirm = input("Type 'CONFIRM' to proceed: ")
    if confirm != "CONFIRM":
        print("❌ Operation cancelled")
        return
    
    await connect_to_mongo()
    db = get_database()
    
    # Drop all collections
    collections = await db.list_collection_names()
    for collection in collections:
        await db.drop_collection(collection)
        print(f"🗑️  Dropped collection: {collection}")
    
    # Reinitialize
    await init_database()
    print("✅ Database reset complete!")


async def create_sample_analytics_data():
    """Create sample analytics data for testing."""
    db = get_database()
    
    # Sample analytics events
    events = [
        {
            "_id": ObjectId(),
            "eventId": f"evt_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_001",
            "eventName": "listing_view",
            "timestamp": datetime.utcnow(),
            "sessionId": "session_123",
            "userRole": "visitor",
            "listingId": None,  # Will be set to actual listing
            "partnerId": None,
            "locality": "Connaught Place",
            "metadata": {
                "source": "search_results",
                "position": 1
            }
        },
        {
            "_id": ObjectId(),
            "eventId": f"evt_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}_002",
            "eventName": "enquiry_submitted",
            "timestamp": datetime.utcnow(),
            "sessionId": "session_123",
            "userRole": "visitor",
            "listingId": None,
            "partnerId": None,
            "locality": "Connaught Place",
            "metadata": {
                "form_type": "quick_enquiry",
                "team_size": "6-15"
            }
        }
    ]
    
    # Get first listing to associate events
    first_listing = await db.listings.find_one()
    if first_listing:
        for event in events:
            event["listingId"] = str(first_listing["_id"])
            event["partnerId"] = str(first_listing["partnerId"])
    
    await db.analytics_events.insert_many(events)
    print("✅ Created sample analytics data")


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "reset":
            asyncio.run(reset_database())
        elif command == "analytics":
            asyncio.run(create_sample_analytics_data())
        else:
            print("Usage: python init_db.py [reset|analytics]")
    else:
        asyncio.run(init_database())