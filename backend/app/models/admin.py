"""Admin models."""
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.common import TimestampMixin, PyObjectId


class AdminUser(TimestampMixin):
    """Admin user model."""
    adminId: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    email: EmailStr
    name: str
    role: str = Field(default="ADMIN")  # ADMIN | SUPER_ADMIN
    status: str = Field(default="ACTIVE")  # ACTIVE | INACTIVE
    
    model_config = ConfigDict(populate_by_name=True)


class AdminUserCreate(BaseModel):
    """Admin user creation request."""
    email: EmailStr
    name: str
    password: str
    role: str = "ADMIN"


class AdminUserUpdate(BaseModel):
    """Admin user update request."""
    name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None