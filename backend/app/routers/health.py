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
    """Health check endpoint with system status.
    
    Uses a lightweight response for frequent load balancer checks,
    with periodic database validation.
    """
    try:
        # Check if this is from internal sources (keep-alive, load balancer, etc.)
        client_host = request.client.host if request.client else "unknown"
        # Render's internal IPs are typically in 10.x.x.x range
        is_internal = (
            client_host in ["127.0.0.1", "localhost", "::1"] or
            client_host.startswith("10.") or
            client_host.startswith("172.") or
            client_host.startswith("192.168.")
        )
        
        # Basic health check (always fast)
        health_data = {
            "status": "ok",
            "timestamp": datetime.utcnow().isoformat(),
            "version": "2.0.0",
            "environment": settings.APP_ENV
        }
        
        # Only check database for external requests or periodically
        # This reduces DB load from constant health checks
        check_database = not is_internal or (datetime.utcnow().second % 30 == 0)
        
        if check_database:
            try:
                from app.db.mongodb import get_database
                db = get_database()
                # Simple ping to test connection
                await db.command("ping")
                health_data["database"] = "connected"
            except Exception as db_error:
                health_data["database"] = f"error: {str(db_error)}"
                health_data["status"] = "degraded"
                # Only log database errors for external requests
                if not is_internal:
                    logger.error(f"Database health check failed: {db_error}")
        else:
            # Skip DB check for frequent internal health checks
            health_data["database"] = "not_checked"
        
        # Don't log internal health checks - they're too frequent
        # Load balancers and monitoring services check constantly
        # Only log external health checks at DEBUG level
        if not is_internal:
            logger.debug(f"Health check from {client_host}: {health_data['status']}")
        
        return health_data
        
    except Exception as e:
        # Only log errors for external requests
        client_host = request.client.host if request.client else "unknown"
        is_internal = (
            client_host in ["127.0.0.1", "localhost", "::1"] or
            client_host.startswith("10.") or
            client_host.startswith("172.") or
            client_host.startswith("192.168.")
        )
        
        if not is_internal:
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
