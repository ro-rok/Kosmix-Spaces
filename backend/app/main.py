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

# Import routers
from app.routers import health, public, auth_partner, auth_admin, partner_listings, admin_listings, admin_partners, leads, visits

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events: startup and shutdown."""
    # Startup
    await connect_to_mongo()
    await create_indexes()
    yield
    # Shutdown
    await close_mongo_connection()


app = FastAPI(
    title="Kosmix Spaces API",
    description="Backend API for Kosmix Spaces workspace marketplace",
    version="1.0.0",
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

# Exception handlers
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """Handle Pydantic validation errors."""
    # Convert errors to JSON-serializable format
    errors = []
    for error in exc.errors():
        error_dict = {
            "type": error.get("type"),
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "input": str(error.get("input")) if error.get("input") is not None else None,
            "url": error.get("url")
        }
        errors.append(error_dict)
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": {
                    "errors": errors
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
    """Handle general exceptions."""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_ERROR",
                "message": "An internal error occurred",
                "details": {}
            }
        }
    )


# Include routers
app.include_router(health.router, prefix="/api", tags=["Health"])
app.include_router(public.router, prefix="/api/public", tags=["Public"])
app.include_router(auth_partner.router, prefix="/api/partner/auth", tags=["Partner Auth"])
app.include_router(partner_listings.router, prefix="/api/partner", tags=["Partner Listings"])
app.include_router(auth_admin.router, prefix="/api/admin/auth", tags=["Admin Auth"])
app.include_router(admin_listings.router, prefix="/api/admin", tags=["Admin Listings"])
app.include_router(admin_partners.router, prefix="/api/admin", tags=["Admin Partners"])
app.include_router(leads.router, prefix="/api/admin", tags=["Admin Leads"])
app.include_router(visits.router, prefix="/api/admin", tags=["Admin Visits"])


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Kosmix Spaces API",
        "version": "1.0.0",
        "docs": "/docs"
    }
