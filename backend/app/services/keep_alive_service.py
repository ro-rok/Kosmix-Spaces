"""
Keep Alive Service for Kosmix Spaces
Maintains server activity and prevents hibernation
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import aiohttp
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.config import get_settings
from app.db.mongodb import get_database

logger = logging.getLogger(__name__)
settings = get_settings()


class KeepAliveService:
    """Service to keep the application alive and maintain connections."""
    
    def __init__(self):
        self.is_running = False
        # Use environment variables with sensible defaults
        self.ping_interval = settings.KEEP_ALIVE_PING_INTERVAL  # 30 minutes default
        self.health_check_interval = settings.KEEP_ALIVE_HEALTH_CHECK_INTERVAL  # 1 hour default
        self.last_ping = None
        self.last_health_check = None
        self.stats = {
            "total_pings": 0,
            "total_health_checks": 0,
            "last_error": None,
            "uptime_start": datetime.utcnow()
        }
    
    async def start(self):
        """Start the keep-alive service."""
        if self.is_running:
            logger.warning("Keep-alive service is already running")
            return
        
        self.is_running = True
        logger.info("Starting keep-alive service")
        
        # Start background tasks with initial delay to allow server startup
        asyncio.create_task(self._ping_loop_with_delay())
        asyncio.create_task(self._health_check_loop_with_delay())
        
    async def _ping_loop_with_delay(self):
        """Ping loop with initial startup delay."""
        # Wait for server to be fully ready before starting pings
        logger.info("Keep-alive service waiting for server startup...")
        await asyncio.sleep(30)  # Wait 30 seconds for server to be ready
        logger.info("Keep-alive ping loop starting...")
        await self._ping_loop()
        
    async def _health_check_loop_with_delay(self):
        """Health check loop with initial startup delay."""
        # Wait for server to be fully ready before starting health checks
        await asyncio.sleep(35)  # Wait 35 seconds, slightly after ping loop
        logger.info("Keep-alive health check loop starting...")
        await self._health_check_loop()
        
    async def stop(self):
        """Stop the keep-alive service."""
        self.is_running = False
        logger.info("Keep-alive service stopped")
    
    async def _ping_loop(self):
        """Main ping loop to keep server active."""
        while self.is_running:
            try:
                await self._perform_ping()
                await asyncio.sleep(self.ping_interval)
            except Exception as e:
                logger.error(f"Error in ping loop: {e}")
                self.stats["last_error"] = str(e)
                await asyncio.sleep(30)  # Wait 30 seconds before retry
    
    async def _health_check_loop(self):
        """Health check loop for database and services."""
        while self.is_running:
            try:
                await self._perform_health_check()
                await asyncio.sleep(self.health_check_interval)
            except Exception as e:
                logger.error(f"Error in health check loop: {e}")
                self.stats["last_error"] = str(e)
                await asyncio.sleep(30)  # Wait 30 seconds before retry    

    async def _perform_ping(self):
        """Perform a ping to keep the server active."""
        try:
            # Self-ping to keep server active
            # Use localhost for client connections instead of 0.0.0.0
            host = "127.0.0.1" if settings.API_HOST == "0.0.0.0" else settings.API_HOST
            base_url = f"http://{host}:{settings.API_PORT}"
            
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=10)) as session:
                async with session.get(f"{base_url}/api/health") as response:
                    if response.status == 200:
                        self.last_ping = datetime.utcnow()
                        self.stats["total_pings"] += 1
                        logger.info("Keep-alive service: ping successful")
                        # Clear any previous error on successful ping
                        if self.stats["last_error"]:
                            logger.info("Keep-alive service recovered from previous errors")
                            self.stats["last_error"] = None
                    else:
                        logger.warning(f"Keep-alive service: ping returned status {response.status}")
                        
        except Exception as e:
            # Only log as error if server should be ready (after initial startup)
            uptime = datetime.utcnow() - self.stats["uptime_start"]
            if uptime.total_seconds() > 60:  # After 1 minute of uptime
                logger.error(f"Keep-alive service: ping failed - {e}")
            else:
                logger.debug(f"Keep-alive service: ping failed during startup - {e}")
            raise
    
    async def _perform_health_check(self):
        """Perform health checks on database and services."""
        try:
            # Database health check
            db = get_database()
            await self._check_database_health(db)
            
            # Update stats
            self.last_health_check = datetime.utcnow()
            self.stats["total_health_checks"] += 1
            
            logger.info("Keep-alive service: health check completed successfully")
            
        except Exception as e:
            logger.error(f"Keep-alive service: health check failed - {e}")
            raise
    
    async def _check_database_health(self, db: AsyncIOMotorDatabase):
        """Check database connectivity and performance."""
        try:
            # Simple ping to database
            await db.command("ping")
            
            # Check collection counts (lightweight operation)
            collections = ["premium_listings", "partners", "leads"]
            for collection_name in collections:
                collection = db[collection_name]
                count = await collection.estimated_document_count()
                logger.debug(f"Collection {collection_name}: {count} documents")
                
        except Exception as e:
            logger.error(f"Keep-alive service: database health check failed - {e}")
            raise 
   
    def get_stats(self) -> Dict[str, Any]:
        """Get keep-alive service statistics."""
        uptime = datetime.utcnow() - self.stats["uptime_start"]
        
        return {
            "is_running": self.is_running,
            "uptime_seconds": int(uptime.total_seconds()),
            "uptime_formatted": str(uptime),
            "last_ping": self.last_ping.isoformat() if self.last_ping else None,
            "last_health_check": self.last_health_check.isoformat() if self.last_health_check else None,
            "total_pings": self.stats["total_pings"],
            "total_health_checks": self.stats["total_health_checks"],
            "last_error": self.stats["last_error"],
            "ping_interval_seconds": self.ping_interval,
            "health_check_interval_seconds": self.health_check_interval
        }
    
    async def manual_ping(self) -> Dict[str, Any]:
        """Perform a manual ping and return results."""
        try:
            await self._perform_ping()
            await self._perform_health_check()
            
            return {
                "success": True,
                "message": "Manual ping completed successfully",
                "timestamp": datetime.utcnow().isoformat(),
                "stats": self.get_stats()
            }
        except Exception as e:
            return {
                "success": False,
                "message": f"Manual ping failed: {str(e)}",
                "timestamp": datetime.utcnow().isoformat(),
                "error": str(e)
            }


# Global instance
keep_alive_service = KeepAliveService()


async def start_keep_alive_service():
    """Start the global keep-alive service."""
    await keep_alive_service.start()


async def stop_keep_alive_service():
    """Stop the global keep-alive service."""
    await keep_alive_service.stop()


def get_keep_alive_stats() -> Dict[str, Any]:
    """Get keep-alive service statistics."""
    return keep_alive_service.get_stats()


async def manual_keep_alive_ping() -> Dict[str, Any]:
    """Perform a manual keep-alive ping."""
    return await keep_alive_service.manual_ping()