"""FastAPI main application."""
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager

from app.core.config import get_settings
from app.core.errors import AppError
from app.db.mongodb import connect_to_mongo, close_mongo_connection
from app.db.indexes import create_indexes
from app.middleware.error_tracking import ErrorTrackingMiddleware, SecurityHeadersMiddleware

# Import routers
from app.routers import (
    health, 
    public, 
    premium_public,
    auth_partner, 
    auth_admin, 
    partner_listings,
    premium_listings,
    admin_listings, 
    admin_premium_listings,
    admin_partners, 
    leads, 
    visits, 
    analytics,
    design_system,
    performance
)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events: startup and shutdown."""
    # Startup
    await connect_to_mongo()
    await create_indexes()
    
    # Initialize performance monitoring
    from app.services.performance_service import cleanup_cache_task, DatabaseOptimizer
    import asyncio
    
    # Start background cache cleanup task
    cleanup_task = asyncio.create_task(cleanup_cache_task())
    
    # Initialize database optimization
    try:
        from app.db.mongodb import get_database
        db = get_database()  # Remove await - get_database() is not async
        optimizer = DatabaseOptimizer(db)
        await optimizer.create_indexes()
    except Exception as e:
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to initialize database optimization: {e}")
    
    yield
    
    # Shutdown
    cleanup_task.cancel()
    await close_mongo_connection()


app = FastAPI(
    title="Kosmix Spaces API",
    description="Backend API for Kosmix Spaces premium workspace marketplace",
    version="2.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom middleware
app.add_middleware(SecurityHeadersMiddleware)
app.add_middleware(ErrorTrackingMiddleware)

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors with enhanced formatting."""
    # Convert errors to JSON-serializable format with better structure
    errors = []
    for error in exc.errors():
        # Extract field path
        field_path = ".".join(str(loc) for loc in error.get("loc", []))
        
        # Create structured error
        error_dict = {
            "field": field_path,
            "type": error.get("type"),
            "message": error.get("msg"),
            "input": str(error.get("input")) if error.get("input") is not None else None,
            "context": error.get("ctx", {})
        }
        errors.append(error_dict)
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {
                    "errors": errors,
                    "error_count": len(errors)
                }
            }
        }
    )


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    """Handle application errors."""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict()
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """Handle general exceptions with enhanced logging and error details."""
    import traceback
    import logging
    
    # Log the full exception for debugging
    logger = logging.getLogger(__name__)
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # Don't expose internal details in production
    error_details = {}
    if settings.debug:
        error_details = {
            "exception_type": type(exc).__name__,
            "traceback": traceback.format_exc()
        }
    
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred. Please try again later.",
                "details": error_details
            }
        }
    )


# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])

# Public routes (enhanced and legacy)
app.include_router(premium_public.router, prefix="/api/public", tags=["Public Enhanced"])
app.include_router(public.router, prefix="/api/public/legacy", tags=["Public Legacy"])

# Authentication routes
app.include_router(auth_partner.router, prefix="/api/partner/auth", tags=["Partner Auth"])
app.include_router(auth_admin.router, prefix="/api/admin/auth", tags=["Admin Auth"])

# Partner routes (enhanced and legacy)
app.include_router(premium_listings.router, prefix="/api/partner", tags=["Partner Premium"])
app.include_router(partner_listings.router, prefix="/api/partner/legacy", tags=["Partner Legacy"])

# Admin routes
app.include_router(admin_listings.router, prefix="/api/admin", tags=["Admin Listings"])
app.include_router(admin_premium_listings.router, prefix="/api/admin", tags=["Admin Premium Listings"])
app.include_router(admin_partners.router, prefix="/api/admin", tags=["Admin Partners"])
app.include_router(leads.router, prefix="/api/admin", tags=["Admin Leads"])
app.include_router(visits.router, prefix="/api/admin", tags=["Admin Visits"])

# Analytics routes
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

# Design system routes
app.include_router(design_system.router, prefix="/api/design-system", tags=["Design System"])

# Performance monitoring routes
app.include_router(performance.router, prefix="/api/performance", tags=["Performance"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Kosmix Spaces Premium API",
        "version": "2.0.0",
        "features": [
            "Enhanced slug-based routing",
            "Premium offering management",
            "Advanced photo management",
            "Enhanced authentication",
            "Comprehensive analytics"
        ],
        "docs": "/docs"
    }
