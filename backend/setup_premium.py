"""Setup script for premium workspace platform backend."""
import asyncio
import os
import sys
from datetime import datetime
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.db.indexes import create_indexes
from app.db.migrate_to_premium import migrate_legacy_to_premium
from app.core.config import get_settings


async def setup_premium_backend():
    """Set up the premium workspace platform backend."""
    print("🚀 Setting up Premium Workspace Platform Backend")
    print("=" * 50)
    
    try:
        # Connect to MongoDB
        print("📊 Connecting to MongoDB...")
        await connect_to_mongo()
        print("✅ Connected to MongoDB")
        
        # Create indexes
        print("🔍 Creating database indexes...")
        await create_indexes()
        print("✅ Database indexes created")
        
        # Check if we need to migrate legacy data
        from app.db.mongodb import get_database
        db = get_database()
        
        legacy_count = await db.listings.count_documents({})
        premium_count = await db.premium_listings.count_documents({})
        
        print(f"📈 Found {legacy_count} legacy listings and {premium_count} premium listings")
        
        if legacy_count > 0 and premium_count == 0:
            print("🔄 Migrating legacy listings to premium format...")
            migration_result = await migrate_legacy_to_premium()
            print(f"✅ Migration complete: {migration_result}")
        elif legacy_count > 0 and premium_count > 0:
            print("⚠️  Both legacy and premium listings exist. Skipping migration.")
            print("   Run migration manually if needed: python -m app.db.migrate_to_premium")
        else:
            print("ℹ️  No legacy listings to migrate")
        
        # Verify configuration
        print("⚙️  Verifying configuration...")
        settings = get_settings()
        
        config_checks = [
            ("JWT_SECRET", bool(settings.JWT_SECRET)),
            ("CLOUDINARY_CLOUD_NAME", bool(settings.CLOUDINARY_CLOUD_NAME)),
            ("CLOUDINARY_API_KEY", bool(settings.CLOUDINARY_API_KEY)),
            ("CLOUDINARY_API_SECRET", bool(settings.CLOUDINARY_API_SECRET)),
            ("ADMIN_EMAIL", bool(settings.ADMIN_EMAIL)),
            ("ADMIN_PASSWORD_HASH", bool(settings.ADMIN_PASSWORD_HASH)),
        ]
        
        all_configured = True
        for config_name, is_set in config_checks:
            status = "✅" if is_set else "❌"
            print(f"   {status} {config_name}: {'Set' if is_set else 'Missing'}")
            if not is_set:
                all_configured = False
        
        if not all_configured:
            print("\n⚠️  Some configuration values are missing!")
            print("   Please check your .env file and ensure all required values are set.")
            print("   See .env.example for reference.")
        
        # Create sample data if database is empty
        partner_count = await db.partners.count_documents({})
        if partner_count == 0:
            print("📝 Creating sample data...")
            await create_sample_data()
            print("✅ Sample data created")
        
        print("\n🎉 Premium Workspace Platform Backend Setup Complete!")
        print("=" * 50)
        print("📚 API Documentation: http://localhost:8000/docs")
        print("🔧 Admin Panel: http://localhost:3000/admin")
        print("🏢 Partner Portal: http://localhost:3000/partner")
        print("🌐 Public Site: http://localhost:3000")
        print("\n🚀 Start the server with: python run_dev.py")
        
    except Exception as e:
        print(f"❌ Setup failed: {e}")
        raise
    finally:
        await close_mongo_connection()


async def create_sample_data():
    """Create sample data for development."""
    from app.db.mongodb import get_database
    from app.core.security import hash_password
    from bson import ObjectId
    
    db = get_database()
    
    # Create sample partner
    partner_doc = {
        "_id": ObjectId(),
        "workspaceBrandName": "Sample Workspace Co",
        "contactName": "John Doe",
        "phone": "+91-9876543210",
        "email": "partner@example.com",
        "passwordHash": hash_password("password123"),
        "status": "ACTIVE",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    await db.partners.insert_one(partner_doc)
    
    # Create sample premium listing
    from app.services.slug_service import ensure_unique_slug
    
    slug_data = await ensure_unique_slug(
        "Sample Workspace Co",
        "Connaught Place",
        "Premium Office Space",
        str(ObjectId())
    )
    
    premium_listing = {
        "_id": ObjectId(),
        "partnerId": partner_doc["_id"],
        "displayName": "Premium Office Space",
        "overview": "A beautiful premium office space in the heart of Delhi with modern amenities and excellent connectivity.",
        "slugData": slug_data,
        "location": {
            "locality": "Connaught Place",
            "city": "Delhi",
            "exactAddress": None,
            "nearMetro": True,
            "metroNote": "2 minutes walk from Rajiv Chowk Metro Station",
            "approximateCoordinates": {"lat": 28.63, "lng": 77.22}
        },
        "offerings": {
            "private-offices": {
                "type": "private-offices",
                "title": "Private Offices",
                "description": "Fully furnished private offices for teams of 2-10 people",
                "features": ["Fully Furnished", "High-Speed Internet", "24/7 Access", "Housekeeping"],
                "enabled": True,
                "startingPrice": 25000,
                "unit": "month",
                "budgetBand": "₹₹",
                "photos": [],
                "capacity": {"minSeats": 2, "maxSeats": 10},
                "availability": "Available"
            },
            "dedicated-desks": {
                "type": "dedicated-desks",
                "title": "Dedicated Desks",
                "description": "Your own dedicated desk in a shared workspace",
                "features": ["Dedicated Desk", "Storage Locker", "High-Speed Internet"],
                "enabled": True,
                "startingPrice": 8000,
                "unit": "month",
                "budgetBand": "₹",
                "photos": [],
                "capacity": {"seats": 1},
                "availability": "Available"
            },
            "hot-desks": {
                "type": "hot-desks",
                "title": "Hot Desks",
                "description": "Flexible seating in our open workspace",
                "features": ["Flexible Seating", "High-Speed Internet", "Common Areas"],
                "enabled": True,
                "startingPrice": 5000,
                "unit": "month",
                "budgetBand": "₹",
                "photos": [],
                "capacity": {"seats": 1},
                "availability": "Available"
            },
            "meeting-rooms": {
                "type": "meeting-rooms",
                "title": "Meeting Rooms",
                "description": "Professional meeting rooms for your team discussions",
                "features": ["Projector", "Whiteboard", "Video Conferencing", "AC"],
                "enabled": True,
                "startingPrice": 500,
                "unit": "hr",
                "budgetBand": "₹",
                "photos": [],
                "capacity": {"roomCount": 3, "maxCapacity": 12},
                "availability": "Available"
            },
            "event-spaces": {
                "type": "event-spaces",
                "title": "Event Spaces",
                "description": "Large spaces for events, workshops, and conferences",
                "features": ["Large Space", "Audio System", "Projector", "Catering Support"],
                "enabled": False,
                "startingPrice": None,
                "unit": None,
                "budgetBand": None,
                "photos": [],
                "capacity": None,
                "availability": None
            }
        },
        "heroPhotos": [],
        "amenities": ["High-Speed WiFi", "Air Conditioning", "Parking", "Cafeteria", "Reception", "Security"],
        "highlights": ["Prime Location", "Metro Connected", "24/7 Access"],
        "verificationStatus": "APPROVED_VERIFIED",
        "verificationChecks": {
            "photosQuality": True,
            "contactVerified": True,
            "locationAccurate": True,
            "offeringsValid": True,
            "pricingReasonable": True
        },
        "adminNotes": "Verified and approved for listing",
        "publishedAt": datetime.utcnow(),
        "isPublished": True,
        "viewCount": 0,
        "enquiryCount": 0,
        "lastViewedAt": None,
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    await db.premium_listings.insert_one(premium_listing)
    
    print("   ✅ Sample partner created (partner@example.com / password123)")
    print("   ✅ Sample premium listing created")


def check_requirements():
    """Check if all requirements are installed."""
    try:
        import fastapi
        import motor
        import pymongo
        import cloudinary
        import bcrypt
        import jose
        print("✅ All required packages are installed")
        return True
    except ImportError as e:
        print(f"❌ Missing required package: {e}")
        print("   Run: pip install -r requirements.txt")
        return False


def main():
    """Main setup function."""
    print("🔍 Checking requirements...")
    if not check_requirements():
        return
    
    # Check if .env file exists
    env_file = Path(".env")
    if not env_file.exists():
        print("⚠️  .env file not found!")
        print("   Copy .env.example to .env and configure your settings")
        
        # Create basic .env file
        env_content = """# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=kosmixspaces

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALG=HS256
JWT_ACCESS_TTL_MIN=60

# Cloudinary (get from https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Admin (for MVP)
ADMIN_EMAIL=admin@kosmix.com
ADMIN_PASSWORD_HASH=$2b$12$example.hash.replace.with.real.bcrypt.hash
"""
        
        with open(".env", "w") as f:
            f.write(env_content)
        
        print("   ✅ Created basic .env file")
        print("   ⚠️  Please update the values in .env before running setup again")
        return
    
    # Run async setup
    asyncio.run(setup_premium_backend())


if __name__ == "__main__":
    main()