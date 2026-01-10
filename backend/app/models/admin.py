"""Admin user models."""
from typing import Optional, Literal
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.common import TimestampMixin, PyObjectId


AdminRole = Literal["SUPER_ADMIN", "ADMIN", "VIEWER"]
AdminStatus = Literal["ACTIVE", "INACTIVE", "SUSPENDED"]


class AdminUser(TimestampMixin):
    """Admin user model."""
    adminId: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    passwordHash: str
    role: AdminRole = "ADMIN"
    status: AdminStatus = "ACTIVE"
    
    # Optional profile fields
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    
    # Access control
    lastLoginAt: Optional[str] = None
    loginAttempts: int = 0
    lockedUntil: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)


class AdminUserCreate(BaseModel):
    """Admin user creation request."""
    email: EmailStr
    password: str
    role: AdminRole = "ADMIN"
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None


class AdminUserUpdate(BaseModel):
    """Admin user update request."""
    role: Optional[AdminRole] = None
    status: Optional[AdminStatus] = None
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None


class AdminLoginRequest(BaseModel):
    """Admin login request."""
    email: EmailStr
    password: str


class AdminLoginResponse(BaseModel):
    """Admin login response."""
    accessToken: str
    tokenType: str = "bearer"
    expiresIn: int
    admin: dict