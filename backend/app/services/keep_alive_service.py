"""
Keep-alive service for Render deployment.
Runs as a background task to ping the backend every 14 minutes.
"""

import asyncio
import aiohttp
import logging
from datetime import datetime

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class KeepAliveService:
    def __init__(self):
        self.running = False
        self.task = None
        # Use RENDER_EXTERNAL_URL if available, otherwise construct from API_HOST and API_PORT
        if settings.RENDER_EXTERNAL_URL:
            self.backend_url = settings.RENDER_EXTERNAL_URL
        else:
            # Construct from settings
            host = "127.0.0.1" if settings.API_HOST == "0.0.0.0" else settings.API_HOST
            self.backend_url = f"http://{host}:{settings.API_PORT}"
        
        # Use settings.KEEP_ALIVE_PING_INTERVAL, with fallback to env var
        self.ping_interval = settings.KEEP_ALIVE_PING_INTERVAL
        
    async def ping_self(self):
        """Ping our own keep-alive endpoint"""
        try:
            keepalive_url = f"{self.backend_url}/api/keepalive"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(keepalive_url, timeout=30) as response:
                    if response.status == 200:
                        data = await response.json()
                        # NOTE: Avoid emojis here because Windows cp1252 console encoding
                        # can raise UnicodeEncodeError when logging them.
                        logger.info(f"Self-ping successful: {data.get('message', 'OK')}")
                        return True
                    else:
                        logger.warning(f"Self-ping returned status {response.status}")
                        return False
                        
        except asyncio.TimeoutError:
            logger.warning("Self-ping timed out")
            return False
        except Exception as e:
            logger.warning(f"Self-ping failed: {str(e)}")
            return False
    
    async def keep_alive_loop(self):
        """Main keep-alive loop"""
        # Avoid emojis in logs to prevent UnicodeEncodeError on some Windows consoles
        logger.info("Starting keep-alive service")
        logger.info(f"Backend URL: {self.backend_url}")
        logger.info(f"Ping interval: {self.ping_interval} seconds ({self.ping_interval/60:.1f} minutes)")
        
        # Wait 2 minutes before first ping to let the app fully start
        await asyncio.sleep(120)
        
        while self.running:
            try:
                await self.ping_self()
                await asyncio.sleep(self.ping_interval)
            except asyncio.CancelledError:
                logger.info("Keep-alive service cancelled")
                break
            except Exception as e:
                logger.error(f"Error in keep-alive loop: {str(e)}")
                # Wait 1 minute before retrying on error
                await asyncio.sleep(60)
        
        logger.info("Keep-alive service stopped")
    
    async def start(self):
        """Start the keep-alive service (async version for Kosmix-Spaces)"""
        if not self.running:
            self.running = True
            self.task = asyncio.create_task(self.keep_alive_loop())
            logger.info("Keep-alive service started")
    
    async def stop(self):
        """Stop the keep-alive service"""
        if self.running:
            self.running = False
            if self.task:
                self.task.cancel()
                try:
                    await self.task
                except asyncio.CancelledError:
                    pass
            logger.info("Keep-alive service stopped")

# Global instance
keep_alive_service = KeepAliveService()


async def start_keep_alive_service():
    """Start the global keep-alive service."""
    await keep_alive_service.start()


async def stop_keep_alive_service():
    """Stop the global keep-alive service."""
    await keep_alive_service.stop()
