"""
Keep Alive Router
Provides endpoints for keep-alive service management
"""
from fastapi import APIRouter, HTTPException
from typing import Dict, Any

from app.services.keep_alive_service import (
    get_keep_alive_stats,
    manual_keep_alive_ping,
    start_keep_alive_service,
    stop_keep_alive_service
)

router = APIRouter()


@router.get("/stats", response_model=Dict[str, Any])
async def get_keep_alive_statistics():
    """Get keep-alive service statistics."""
    try:
        return get_keep_alive_stats()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get keep-alive stats: {str(e)}")


@router.post("/ping", response_model=Dict[str, Any])
async def manual_ping():
    """Perform a manual keep-alive ping."""
    try:
        return await manual_keep_alive_ping()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Manual ping failed: {str(e)}")


@router.post("/start", response_model=Dict[str, Any])
async def start_service():
    """Start the keep-alive service."""
    try:
        await start_keep_alive_service()
        return {
            "success": True,
            "message": "Keep-alive service started successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start keep-alive service: {str(e)}")


@router.post("/stop", response_model=Dict[str, Any])
async def stop_service():
    """Stop the keep-alive service."""
    try:
        await stop_keep_alive_service()
        return {
            "success": True,
            "message": "Keep-alive service stopped successfully"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop keep-alive service: {str(e)}")