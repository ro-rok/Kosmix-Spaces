"""Database health check and monitoring utilities."""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Any, List
from bson import ObjectId

from app.db.mongodb import connect_to_mongo, get_database, close_mongo_connection


class DatabaseHealthCheck:
    """Database health monitoring and diagnostics."""
    
    async def check_connection(self) -> Dict[str, Any]:
        """Check database connection."""
        try:
            await connect_to_mongo()
            db = get_database()
            
            # Ping database
            result = await db.command("ping")
            
            return {
                "status": "healthy",
                "ping_result": result,
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }
    
    async def check_collections(self) -> Dict[str, Any]:
        """Check collection status and document counts."""
        await connect_to_mongo()
        db = get_database()
        
        collections_info = {}
        collection_names = await db.list_collection_names()
        
        for collection_name in collection_names:
            collection = db[collection_name]
            
            # Get document count
            count = await collection.count_documents({})
            
            # Get collection stats
            try:
                stats = await db.command("collStats", collection_name)
                size_bytes = stats.get("size", 0)
                index_count = stats.get("nindexes", 0)
            except Exception:
                size_bytes = 0
                index_count = 0
            
            collections_info[collection_name] = {
                "document_count": count,
                "size_bytes": size_bytes,
                "size_mb": round(size_bytes / (1024 * 1024), 2),
                "index_count": index_count
            }
        
        await close_mongo_connection()
        return collections_info
    
    async def check_indexes(self) -> Dict[str, Any]:
        """Check index status and performance."""
        await connect_to_mongo()
        db = get_database()
        
        index_info = {}
        collection_names = await db.list_collection_names()
        
        for collection_name in collection_names:
            collection = db[collection_name]
            
            # Get index information
            indexes = await collection.list_indexes().to_list(length=None)
            
            index_info[collection_name] = []
            for index in indexes:
                index_info[collection_name].append({
                    "name": index.get("name"),
                    "key": index.get("key"),
                    "unique": index.get("unique", False),
                    "sparse": index.get("sparse", False),
                    "background": index.get("background", False)
                })
        
        await close_mongo_connection()
        return index_info
    
    async def check_data_integrity(self) -> Dict[str, Any]:
        """Check data integrity and relationships."""
        await connect_to_mongo()
        db = get_database()
        
        issues = []
        
        # Check for orphaned listings (partner doesn't exist)
        listings_cursor = db.listings.find({}, {"partnerId": 1})
        async for listing in listings_cursor:
            partner_exists = await db.partners.find_one({"_id": listing["partnerId"]})
            if not partner_exists:
                issues.append({
                    "type": "orphaned_listing",
                    "listing_id": str(listing["_id"]),
                    "partner_id": str(listing["partnerId"])
                })
        
        # Check for leads without valid listing references
        leads_cursor = db.leads.find({"listingSlug": {"$ne": None}}, {"listingSlug": 1})
        async for lead in leads_cursor:
            if lead.get("listingSlug"):
                listing_exists = await db.listings.find_one({"slug": lead["listingSlug"]})
                if not listing_exists:
                    issues.append({
                        "type": "invalid_listing_reference",
                        "lead_id": str(lead["_id"]),
                        "listing_slug": lead["listingSlug"]
                    })
        
        # Check for duplicate slugs
        pipeline = [
            {"$group": {"_id": "$slug", "count": {"$sum": 1}, "ids": {"$push": "$_id"}}},
            {"$match": {"count": {"$gt": 1}}}
        ]
        duplicate_slugs = await db.listings.aggregate(pipeline).to_list(length=None)
        for dup in duplicate_slugs:
            issues.append({
                "type": "duplicate_slug",
                "slug": dup["_id"],
                "listing_ids": [str(id) for id in dup["ids"]]
            })
        
        await close_mongo_connection()
        
        return {
            "issues_found": len(issues),
            "issues": issues
        }
    
    async def check_performance_metrics(self) -> Dict[str, Any]:
        """Check database performance metrics."""
        await connect_to_mongo()
        db = get_database()
        
        # Get server status
        server_status = await db.command("serverStatus")
        
        # Extract key metrics
        metrics = {
            "connections": {
                "current": server_status.get("connections", {}).get("current", 0),
                "available": server_status.get("connections", {}).get("available", 0)
            },
            "memory": {
                "resident_mb": server_status.get("mem", {}).get("resident", 0),
                "virtual_mb": server_status.get("mem", {}).get("virtual", 0)
            },
            "operations": {
                "insert": server_status.get("opcounters", {}).get("insert", 0),
                "query": server_status.get("opcounters", {}).get("query", 0),
                "update": server_status.get("opcounters", {}).get("update", 0),
                "delete": server_status.get("opcounters", {}).get("delete", 0)
            },
            "uptime_seconds": server_status.get("uptime", 0)
        }
        
        await close_mongo_connection()
        return metrics
    
    async def check_recent_activity(self, hours: int = 24) -> Dict[str, Any]:
        """Check recent database activity."""
        await connect_to_mongo()
        db = get_database()
        
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        
        activity = {}
        
        # Recent listings
        recent_listings = await db.listings.count_documents({
            "createdAt": {"$gte": cutoff_time}
        })
        
        # Recent leads
        recent_leads = await db.leads.count_documents({
            "createdAt": {"$gte": cutoff_time}
        })
        
        # Recent analytics events
        recent_events = await db.analytics_events.count_documents({
            "timestamp": {"$gte": cutoff_time}
        })
        
        # Recent partner registrations
        recent_partners = await db.partners.count_documents({
            "createdAt": {"$gte": cutoff_time}
        })
        
        activity = {
            "time_period_hours": hours,
            "cutoff_time": cutoff_time.isoformat(),
            "new_listings": recent_listings,
            "new_leads": recent_leads,
            "analytics_events": recent_events,
            "new_partners": recent_partners
        }
        
        await close_mongo_connection()
        return activity
    
    async def full_health_check(self) -> Dict[str, Any]:
        """Run complete health check."""
        print("🔄 Running database health check...")
        
        health_report = {
            "timestamp": datetime.utcnow().isoformat(),
            "overall_status": "healthy"
        }
        
        # Connection check
        print("  Checking connection...")
        connection_status = await self.check_connection()
        health_report["connection"] = connection_status
        
        if connection_status["status"] != "healthy":
            health_report["overall_status"] = "unhealthy"
            return health_report
        
        # Collections check
        print("  Checking collections...")
        health_report["collections"] = await self.check_collections()
        
        # Indexes check
        print("  Checking indexes...")
        health_report["indexes"] = await self.check_indexes()
        
        # Data integrity check
        print("  Checking data integrity...")
        integrity_check = await self.check_data_integrity()
        health_report["data_integrity"] = integrity_check
        
        if integrity_check["issues_found"] > 0:
            health_report["overall_status"] = "warning"
        
        # Performance metrics
        print("  Checking performance metrics...")
        health_report["performance"] = await self.check_performance_metrics()
        
        # Recent activity
        print("  Checking recent activity...")
        health_report["recent_activity"] = await self.check_recent_activity()
        
        print("✅ Health check completed!")
        return health_report


async def main():
    """CLI interface for health checks."""
    import sys
    import json
    
    health_checker = DatabaseHealthCheck()
    
    if len(sys.argv) < 2:
        print("Usage: python health_check.py [full|connection|collections|indexes|integrity|performance|activity]")
        return
    
    command = sys.argv[1]
    
    try:
        if command == "full":
            result = await health_checker.full_health_check()
        elif command == "connection":
            result = await health_checker.check_connection()
        elif command == "collections":
            result = await health_checker.check_collections()
        elif command == "indexes":
            result = await health_checker.check_indexes()
        elif command == "integrity":
            result = await health_checker.check_data_integrity()
        elif command == "performance":
            result = await health_checker.check_performance_metrics()
        elif command == "activity":
            hours = int(sys.argv[2]) if len(sys.argv) > 2 else 24
            result = await health_checker.check_recent_activity(hours)
        else:
            print(f"Unknown command: {command}")
            return
        
        print(json.dumps(result, indent=2, default=str))
    
    except Exception as e:
        print(f"❌ Error: {e}")


if __name__ == "__main__":
    asyncio.run(main())