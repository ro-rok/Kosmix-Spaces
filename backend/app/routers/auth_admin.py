"""Admin authentication routes."""
from fastapi import APIRouter, Depends
from app.core.security import (
    verify_password,
    create_access_token,
    require_admin
)
from app.core.config import get_settings
from app.schemas.auth import AdminLoginRequest, TokenResponse
from app.core.errors import UnauthorizedError
from app.db.mongodb import get_database

router = APIRouter()
settings = get_settings()


@router.post("/login", response_model=TokenResponse)
async def login_admin(credentials: AdminLoginRequest):
    """Admin login."""
    # For MVP, use env vars for single admin user
    if credentials.email != settings.ADMIN_EMAIL:
        raise UnauthorizedError("Invalid email or password")
    
    if not verify_password(credentials.password, settings.ADMIN_PASSWORD_HASH):
        raise UnauthorizedError("Invalid email or password")
    
    # Create JWT token
    token_data = {
        "sub": settings.ADMIN_EMAIL,
        "role": "ADMIN",
        "adminId": "admin"  # Single admin for MVP
    }
    access_token = create_access_token(token_data)
    
    return TokenResponse(accessToken=access_token)


@router.get("/me")
async def get_admin_me(current_user: dict = Depends(require_admin)):
    """Get current admin info."""
    return {
        "adminId": current_user["adminId"],
        "email": current_user["sub"],
        "role": "ADMIN"
    }
