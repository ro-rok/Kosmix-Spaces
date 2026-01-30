"""Custom logging configuration to filter health check spam."""
import logging
from typing import Any


class HealthCheckFilter(logging.Filter):
    """Filter out health check requests from access logs."""
    
    def filter(self, record: logging.LogRecord) -> bool:
        """Return False for health check requests to suppress them."""
        # Check if this is an access log record
        if hasattr(record, 'args') and len(record.args) >= 3:
            # uvicorn access logs have format: client_addr - "method path protocol" status_code
            try:
                request_line = str(record.args[2]) if len(record.args) > 2 else ""
                # Filter out /health and /api/health requests
                if "/health" in request_line or "/api/health" in request_line:
                    return False
                # Also filter out /api/keepalive
                if "/keepalive" in request_line or "/api/keepalive" in request_line:
                    return False
            except (IndexError, AttributeError):
                pass
        
        return True


def setup_logging():
    """Configure logging with health check filtering."""
    # Get uvicorn's access logger
    access_logger = logging.getLogger("uvicorn.access")
    
    # Add the health check filter
    health_filter = HealthCheckFilter()
    access_logger.addFilter(health_filter)
    
    # Also add to root uvicorn logger
    uvicorn_logger = logging.getLogger("uvicorn")
    uvicorn_logger.addFilter(health_filter)
