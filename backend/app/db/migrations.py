"""Database migration utilities."""
import asyncio
import logging
from datetime import datetime
from typing import List, Dict, Any
from bson import ObjectId
from pymongo.errors import OperationFailure

from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection

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


class Migration:
    """Base migration class."""
    
    def __init__(self, version: str, description: str):
        self.version = version
        self.description = description
    
    async def up(self, db):
        """Apply migration."""
        raise NotImplementedError
    
    async def down(self, db):
        """Rollback migration."""
        raise NotImplementedError


class Migration001AddAdminModel(Migration):
    """Add admin model and collection."""
    
    def __init__(self):
        super().__init__("001", "Add admin model and collection")
    
    async def up(self, db):
        """Create admin collection and indexes."""
        # Create admin collection if it doesn't exist
        collections = await db.list_collection_names()
        if "admins" not in collections:
            await db.create_collection("admins")
        
        # Create indexes
        await safe_create_index(db.admins, "email", unique=True)
        await safe_create_index(db.admins, "status")
        
        print("✅ Created admin collection and indexes")
    
    async def down(self, db):
        """Drop admin collection."""
        await db.drop_collection("admins")
        print("✅ Dropped admin collection")


class Migration002AddAnalyticsIndexes(Migration):
    """Add additional analytics indexes for performance."""
    
    def __init__(self):
        super().__init__("002", "Add analytics performance indexes")
    
    async def up(self, db):
        """Add compound indexes for analytics queries."""
        # Time-based queries with filters
        await safe_create_index(db.analytics_events, [
            ("timestamp", -1),
            ("eventName", 1),
            ("locality", 1)
        ])
        
        # Partner analytics
        await safe_create_index(db.analytics_events, [
            ("partnerId", 1),
            ("timestamp", -1),
            ("eventName", 1)
        ])
        
        # Listing analytics
        await safe_create_index(db.analytics_events, [
            ("listingId", 1),
            ("timestamp", -1),
            ("eventName", 1)
        ])
        
        print("✅ Added analytics performance indexes")
    
    async def down(self, db):
        """Remove the indexes."""
        # Note: MongoDB doesn't have a direct way to drop specific compound indexes
        # This would require knowing the exact index names
        print("⚠️  Manual index cleanup required")


class Migration003AddListingSearchIndexes(Migration):
    """Add text search indexes for listings."""
    
    def __init__(self):
        super().__init__("003", "Add listing text search indexes")
    
    async def up(self, db):
        """Add text search index."""
        await safe_create_index(db.listings, [
            ("displayName", "text"),
            ("locality", "text"),
            ("overview", "text"),
            ("amenities", "text")
        ])
        
        print("✅ Added listing text search index")
    
    async def down(self, db):
        """Drop text search index."""
        await db.listings.drop_index("displayName_text_locality_text_overview_text_amenities_text")
        print("✅ Dropped listing text search index")


class MigrationRunner:
    """Migration runner."""
    
    def __init__(self):
        self.migrations: List[Migration] = [
            Migration001AddAdminModel(),
            Migration002AddAnalyticsIndexes(),
            Migration003AddListingSearchIndexes(),
        ]
    
    async def get_applied_migrations(self, db) -> List[str]:
        """Get list of applied migration versions."""
        try:
            cursor = db.migrations.find({}, {"version": 1})
            return [doc["version"] async for doc in cursor]
        except Exception:
            # Migrations collection doesn't exist yet
            return []
    
    async def mark_migration_applied(self, db, migration: Migration):
        """Mark migration as applied."""
        await db.migrations.insert_one({
            "version": migration.version,
            "description": migration.description,
            "appliedAt": datetime.utcnow()
        })
    
    async def mark_migration_reverted(self, db, migration: Migration):
        """Mark migration as reverted."""
        await db.migrations.delete_one({"version": migration.version})
    
    async def migrate_up(self, target_version: str = None):
        """Apply migrations up to target version."""
        await connect_to_mongo()
        db = get_database()
        
        applied = await self.get_applied_migrations(db)
        
        for migration in self.migrations:
            if migration.version in applied:
                continue
            
            if target_version and migration.version > target_version:
                break
            
            print(f"🔄 Applying migration {migration.version}: {migration.description}")
            try:
                await migration.up(db)
                await self.mark_migration_applied(db, migration)
                print(f"✅ Applied migration {migration.version}")
            except Exception as e:
                print(f"❌ Failed to apply migration {migration.version}: {e}")
                break
        
        await close_mongo_connection()
    
    async def migrate_down(self, target_version: str):
        """Rollback migrations down to target version."""
        await connect_to_mongo()
        db = get_database()
        
        applied = await self.get_applied_migrations(db)
        
        # Reverse order for rollback
        for migration in reversed(self.migrations):
            if migration.version not in applied:
                continue
            
            if migration.version <= target_version:
                break
            
            print(f"🔄 Rolling back migration {migration.version}: {migration.description}")
            try:
                await migration.down(db)
                await self.mark_migration_reverted(db, migration)
                print(f"✅ Rolled back migration {migration.version}")
            except Exception as e:
                print(f"❌ Failed to rollback migration {migration.version}: {e}")
                break
        
        await close_mongo_connection()
    
    async def status(self):
        """Show migration status."""
        await connect_to_mongo()
        db = get_database()
        
        applied = await self.get_applied_migrations(db)
        
        print("Migration Status:")
        print("-" * 50)
        
        for migration in self.migrations:
            status = "✅ Applied" if migration.version in applied else "⏳ Pending"
            print(f"{migration.version}: {migration.description} - {status}")
        
        await close_mongo_connection()


async def main():
    """CLI interface for migrations."""
    import sys
    
    runner = MigrationRunner()
    
    if len(sys.argv) < 2:
        print("Usage: python migrations.py [up|down|status] [version]")
        return
    
    command = sys.argv[1]
    
    if command == "up":
        target = sys.argv[2] if len(sys.argv) > 2 else None
        await runner.migrate_up(target)
    elif command == "down":
        if len(sys.argv) < 3:
            print("Target version required for rollback")
            return
        target = sys.argv[2]
        await runner.migrate_down(target)
    elif command == "status":
        await runner.status()
    else:
        print("Unknown command. Use: up, down, or status")


if __name__ == "__main__":
    asyncio.run(main())