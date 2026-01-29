"""Health check endpoint."""
from fastapi import APIRouter, HTTPException, Request
from datetime import datetime
import asyncio
import logging

from app.core.config import get_settings

router = APIRouter()
settings = get_settings()
logger = logging.getLogger(__name__)


@router.get("/health")
async def health_check(request: Request):
    """Health check endpoint with system status."""
    try:
        # Check if this is from keep-alive service (localhost/127.0.0.1)
        client_host = request.client.host if request.client else "unknown"
        is_keep_alive = client_host in ["127.0.0.1", "localhost", "::1"]
        
        # Basic health check
        health_data = {
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.0.0",
            "environment": settings.APP_ENV
        }
        
        # Test database connection
        try:
            from app.db.mongodb import get_database
            db = get_database()
            # Simple ping to test connection
            await db.command("ping")
            health_data["database"] = "connected"
        except Exception as db_error:
            health_data["database"] = f"error: {str(db_error)}"
            health_data["status"] = "degraded"
            # Only log database errors for external requests, not keep-alive
            if not is_keep_alive:
                logger.error(f"Database health check failed: {db_error}")
        
        # Don't log keep-alive service calls - they're too frequent
        # Only log external health checks
        if not is_keep_alive:
            logger.info(f"External health check from {client_host}: {health_data['status']}")
        
        return health_data
        
    except Exception as e:
        # Only log errors for external requests, not keep-alive
        client_host = request.client.host if request.client else "unknown"
        is_keep_alive = client_host in ["127.0.0.1", "localhost", "::1"]
        
        if not is_keep_alive:
            logger.error(f"Health check error: {e}", exc_info=True)
        
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Health check failed",
                "message": str(e),
                "debug": settings.debug
            }
        )


@router.options("/health")
async def health_options():
    """Handle OPTIONS request for health endpoint."""
    return {"status": "ok"}


@router.get("/debug")
async def debug_info():
    """Debug endpoint to check configuration."""
    if not settings.debug:
        raise HTTPException(status_code=404, detail="Not found")
    
    return {
        "cors_origins": settings.cors_origins_list,
        "app_env": settings.APP_ENV,
        "debug": settings.debug,
        "api_host": settings.API_HOST,
        "api_port": settings.API_PORT
    }
