"""Health check endpoint."""
from fastapi import APIRouter, HTTPException
from datetime import datetime
import asyncio

from app.core.config import get_settings

router = APIRouter()
settings = get_settings()


@router.get("/health")
async def health_check():
    """Health check endpoint with system status."""
    try:
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
        
        return health_data
        
    except Exception as e:
        # Log the error for debugging
        import logging
        logger = logging.getLogger(__name__)
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
