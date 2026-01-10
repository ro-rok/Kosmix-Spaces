"""Migration script for design system collections."""
import asyncio
from datetime import datetime
from bson import ObjectId

from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection
from app.models.design_system import DesignSystemConfig, DesignSystemMetrics


async def migrate_design_system():
    """Create design system collections and seed initial data."""
    print("🔄 Connecting to MongoDB...")
    await connect_to_mongo()
    
    db = get_database()
    
    print("🔄 Creating design system collections...")
    
    # Create design system configuration collection
    await create_design_system_config(db)
    
    # Create design system metrics collection
    await create_design_system_metrics(db)
    
    # Create indexes
    await create_design_system_indexes(db)
    
    print("✅ Design system migration complete!")
    
    await close_mongo_connection()


async def create_design_system_config(db):
    """Create default design system configuration."""
    # Check if configuration already exists
    existing_config = await db.design_system_config.find_one({"environment": "production"})
    
    if existing_config:
        print("ℹ️  Design system configuration already exists")
        return
    
    # Create default configuration
    config = DesignSystemConfig()
    config_dict = config.model_dump(by_alias=True)
    config_dict["_id"] = ObjectId()
    
    await db.design_system_config.insert_one(config_dict)
    print("✅ Created default design system configuration")


async def create_design_system_metrics(db):
    """Create default design system metrics."""
    # Check if metrics already exist
    existing_metrics = await db.design_system_metrics.find_one({"type": "global"})
    
    if existing_metrics:
        print("ℹ️  Design system metrics already exist")
        return
    
    # Create default metrics
    metrics = DesignSystemMetrics()
    metrics_dict = metrics.model_dump()
    metrics_dict["_id"] = ObjectId()
    metrics_dict["type"] = "global"
    
    await db.design_system_metrics.insert_one(metrics_dict)
    print("✅ Created default design system metrics")


async def create_design_system_indexes(db):
    """Create indexes for design system collections."""
    # Design system config indexes
    await db.design_system_config.create_index("environment", unique=True)
    await db.design_system_config.create_index("version")
    await db.design_system_config.create_index("updatedAt")
    
    # User preferences indexes
    await db.user_design_preferences.create_index([("userId", 1), ("userType", 1)], unique=True)
    await db.user_design_preferences.create_index("userType")
    await db.user_design_preferences.create_index("lastDevice")
    await db.user_design_preferences.create_index("updatedAt")
    await db.user_design_preferences.create_index("preferences.theme")
    await db.user_design_preferences.create_index("preferences.animationLevel")
    await db.user_design_preferences.create_index("preferences.highContrast")
    await db.user_design_preferences.create_index("preferences.reduceMotion")
    
    # Analytics indexes
    await db.design_system_analytics.create_index("timestamp")
    await db.design_system_analytics.create_index([("timestamp", -1)])
    await db.design_system_analytics.create_index("cssLoadTime")
    await db.design_system_analytics.create_index("renderTime")
    await db.design_system_analytics.create_index("accessibilityScore")
    
    # Metrics indexes
    await db.design_system_metrics.create_index("type", unique=True)
    await db.design_system_metrics.create_index("lastUpdated")
    
    print("✅ Created design system indexes")


async def seed_sample_user_preferences(db):
    """Seed sample user preferences for testing."""
    sample_preferences = [
        {
            "_id": ObjectId(),
            "userId": "sample_user_1",
            "userType": "anonymous",
            "preferences": {
                "theme": "light",
                "animationLevel": "full",
                "density": "comfortable",
                "enableGlassEffects": True,
                "enableMicroInteractions": True,
                "enableSkeletonShimmer": True,
                "enableStickyElements": True,
                "enableMobileOptimizations": True,
                "enableSwipeGestures": True,
                "enableHapticFeedback": False,
                "reduceMotion": False,
                "highContrast": False,
                "largeText": False,
                "screenReaderOptimized": False
            },
            "devicePreferences": {},
            "lastDevice": "desktop",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        },
        {
            "_id": ObjectId(),
            "userId": "sample_user_2",
            "userType": "anonymous",
            "preferences": {
                "theme": "dark",
                "animationLevel": "reduced",
                "density": "compact",
                "enableGlassEffects": False,
                "enableMicroInteractions": True,
                "enableSkeletonShimmer": True,
                "enableStickyElements": True,
                "enableMobileOptimizations": True,
                "enableSwipeGestures": True,
                "enableHapticFeedback": True,
                "reduceMotion": True,
                "highContrast": False,
                "largeText": False,
                "screenReaderOptimized": False
            },
            "devicePreferences": {},
            "lastDevice": "mobile",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
    ]
    
    await db.user_design_preferences.insert_many(sample_preferences)
    print("✅ Created sample user preferences")


async def rollback_design_system():
    """Rollback design system migration (remove collections)."""
    print("⚠️  WARNING: This will remove all design system data!")
    confirm = input("Type 'CONFIRM' to proceed: ")
    if confirm != "CONFIRM":
        print("❌ Rollback cancelled")
        return
    
    await connect_to_mongo()
    db = get_database()
    
    # Drop design system collections
    collections_to_drop = [
        "design_system_config",
        "user_design_preferences", 
        "design_system_analytics",
        "design_system_metrics"
    ]
    
    for collection in collections_to_drop:
        try:
            await db.drop_collection(collection)
            print(f"🗑️  Dropped collection: {collection}")
        except Exception as e:
            print(f"⚠️  Could not drop {collection}: {e}")
    
    print("✅ Design system rollback complete!")
    await close_mongo_connection()


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        command = sys.argv[1]
        if command == "rollback":
            asyncio.run(rollback_design_system())
        elif command == "seed":
            asyncio.run(migrate_design_system())
            # Also seed sample data
            async def seed_all():
                await connect_to_mongo()
                db = get_database()
                await seed_sample_user_preferences(db)
                await close_mongo_connection()
            asyncio.run(seed_all())
        else:
            print("Usage: python migrate_design_system.py [rollback|seed]")
    else:
        asyncio.run(migrate_design_system())