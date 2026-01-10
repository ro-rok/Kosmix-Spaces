"""Database backup and restore utilities."""
import asyncio
import json
import os
from datetime import datetime
from typing import Dict, Any, List
from bson import ObjectId
from bson.json_util import dumps, loads

from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection
from app.core.config import get_settings

settings = get_settings()


class DatabaseBackup:
    """Database backup and restore utility."""
    
    def __init__(self, backup_dir: str = "backups"):
        self.backup_dir = backup_dir
        os.makedirs(backup_dir, exist_ok=True)
    
    async def create_backup(self, backup_name: str = None) -> str:
        """Create a full database backup."""
        if not backup_name:
            backup_name = f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        backup_path = os.path.join(self.backup_dir, f"{backup_name}.json")
        
        await connect_to_mongo()
        db = get_database()
        
        backup_data = {
            "metadata": {
                "created_at": datetime.utcnow().isoformat(),
                "database_name": settings.MONGODB_DB,
                "version": "1.0"
            },
            "collections": {}
        }
        
        # Get all collections
        collection_names = await db.list_collection_names()
        
        for collection_name in collection_names:
            print(f"🔄 Backing up collection: {collection_name}")
            collection = db[collection_name]
            
            # Get all documents
            documents = []
            async for doc in collection.find():
                documents.append(doc)
            
            backup_data["collections"][collection_name] = documents
            print(f"✅ Backed up {len(documents)} documents from {collection_name}")
        
        # Write backup file
        with open(backup_path, 'w') as f:
            f.write(dumps(backup_data, indent=2))
        
        await close_mongo_connection()
        
        print(f"✅ Backup created: {backup_path}")
        return backup_path
    
    async def restore_backup(self, backup_path: str, drop_existing: bool = False):
        """Restore database from backup."""
        if not os.path.exists(backup_path):
            raise FileNotFoundError(f"Backup file not found: {backup_path}")
        
        print(f"🔄 Restoring from backup: {backup_path}")
        
        # Load backup data
        with open(backup_path, 'r') as f:
            backup_data = loads(f.read())
        
        await connect_to_mongo()
        db = get_database()
        
        if drop_existing:
            print("⚠️  Dropping existing collections...")
            existing_collections = await db.list_collection_names()
            for collection_name in existing_collections:
                await db.drop_collection(collection_name)
                print(f"🗑️  Dropped collection: {collection_name}")
        
        # Restore collections
        for collection_name, documents in backup_data["collections"].items():
            if not documents:
                continue
            
            print(f"🔄 Restoring collection: {collection_name}")
            collection = db[collection_name]
            
            if drop_existing:
                # Insert all documents
                if documents:
                    await collection.insert_many(documents)
            else:
                # Insert documents that don't exist (based on _id)
                for doc in documents:
                    existing = await collection.find_one({"_id": doc["_id"]})
                    if not existing:
                        await collection.insert_one(doc)
            
            print(f"✅ Restored {len(documents)} documents to {collection_name}")
        
        await close_mongo_connection()
        print("✅ Restore completed!")
    
    async def list_backups(self) -> List[Dict[str, Any]]:
        """List available backups."""
        backups = []
        
        for filename in os.listdir(self.backup_dir):
            if filename.endswith('.json'):
                filepath = os.path.join(self.backup_dir, filename)
                stat = os.stat(filepath)
                
                # Try to read metadata
                try:
                    with open(filepath, 'r') as f:
                        data = loads(f.read())
                        metadata = data.get("metadata", {})
                except Exception:
                    metadata = {}
                
                backups.append({
                    "filename": filename,
                    "filepath": filepath,
                    "size_bytes": stat.st_size,
                    "created_at": metadata.get("created_at"),
                    "database_name": metadata.get("database_name"),
                    "version": metadata.get("version")
                })
        
        # Sort by creation time (newest first)
        backups.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return backups
    
    async def export_collection(self, collection_name: str, output_path: str = None):
        """Export a single collection to JSON."""
        if not output_path:
            output_path = f"{collection_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.json"
        
        await connect_to_mongo()
        db = get_database()
        
        collection = db[collection_name]
        documents = []
        
        async for doc in collection.find():
            documents.append(doc)
        
        with open(output_path, 'w') as f:
            f.write(dumps(documents, indent=2))
        
        await close_mongo_connection()
        
        print(f"✅ Exported {len(documents)} documents from {collection_name} to {output_path}")
        return output_path
    
    async def import_collection(self, collection_name: str, input_path: str, replace: bool = False):
        """Import a collection from JSON."""
        if not os.path.exists(input_path):
            raise FileNotFoundError(f"Import file not found: {input_path}")
        
        with open(input_path, 'r') as f:
            documents = loads(f.read())
        
        await connect_to_mongo()
        db = get_database()
        
        collection = db[collection_name]
        
        if replace:
            await collection.drop()
            print(f"🗑️  Dropped existing collection: {collection_name}")
        
        if documents:
            await collection.insert_many(documents)
        
        await close_mongo_connection()
        
        print(f"✅ Imported {len(documents)} documents to {collection_name}")


async def main():
    """CLI interface for backup operations."""
    import sys
    
    backup_util = DatabaseBackup()
    
    if len(sys.argv) < 2:
        print("Usage: python backup.py [backup|restore|list|export|import] [options]")
        print("Commands:")
        print("  backup [name]                    - Create backup")
        print("  restore <path> [--drop]          - Restore from backup")
        print("  list                             - List available backups")
        print("  export <collection> [path]       - Export collection")
        print("  import <collection> <path> [--replace] - Import collection")
        return
    
    command = sys.argv[1]
    
    try:
        if command == "backup":
            name = sys.argv[2] if len(sys.argv) > 2 else None
            await backup_util.create_backup(name)
        
        elif command == "restore":
            if len(sys.argv) < 3:
                print("Backup path required")
                return
            path = sys.argv[2]
            drop = "--drop" in sys.argv
            await backup_util.restore_backup(path, drop)
        
        elif command == "list":
            backups = await backup_util.list_backups()
            print("Available Backups:")
            print("-" * 80)
            for backup in backups:
                size_mb = backup["size_bytes"] / (1024 * 1024)
                print(f"{backup['filename']:<30} {size_mb:>8.2f} MB  {backup.get('created_at', 'Unknown')}")
        
        elif command == "export":
            if len(sys.argv) < 3:
                print("Collection name required")
                return
            collection = sys.argv[2]
            path = sys.argv[3] if len(sys.argv) > 3 else None
            await backup_util.export_collection(collection, path)
        
        elif command == "import":
            if len(sys.argv) < 4:
                print("Collection name and file path required")
                return
            collection = sys.argv[2]
            path = sys.argv[3]
            replace = "--replace" in sys.argv
            await backup_util.import_collection(collection, path, replace)
        
        else:
            print(f"Unknown command: {command}")
    
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())