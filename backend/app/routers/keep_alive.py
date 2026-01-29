# app/routers/keep_alive.py
from fastapi import APIRouter
from datetime import datetime
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

@router.get("/keepalive")
def keepalive():
    """
    Keep-alive endpoint to prevent the backend from going cold.
    Returns current timestamp and status.
    """
    current_time = datetime.utcnow().isoformat()
    logger.info(f"Keep-alive ping received at {current_time}")
    
    return {
        "status": "alive",
        "timestamp": current_time,
        "message": "Backend is running"
    }
