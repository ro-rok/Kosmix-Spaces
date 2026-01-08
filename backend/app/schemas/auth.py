"""Authentication schemas."""
from pydantic import BaseModel, EmailStr


class PartnerLoginRequest(BaseModel):
    """Partner login request."""
    email: EmailStr
    password: str


class AdminLoginRequest(BaseModel):
    """Admin login request."""
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    """JWT token response."""
    accessToken: str
    tokenType: str = "bearer"
