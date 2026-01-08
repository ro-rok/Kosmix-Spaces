"""Partner account models."""
from typing import Optional
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.common import TimestampMixin, PyObjectId


class PartnerAccount(TimestampMixin):
    """Partner account model."""
    partnerId: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    workspaceBrandName: str
    contactName: str
    phone: str
    email: EmailStr
    passwordHash: str
    status: str = Field(default="PENDING")  # ACTIVE | PENDING | SUSPENDED
    
    model_config = ConfigDict(populate_by_name=True)


class PartnerAccountCreate(BaseModel):
    """Partner account creation request."""
    workspaceBrandName: str
    contactName: str
    phone: str
    email: EmailStr
    password: str


class PartnerAccountUpdate(BaseModel):
    """Partner account update request."""
    workspaceBrandName: Optional[str] = None
    contactName: Optional[str] = None
    phone: Optional[str] = None
    status: Optional[str] = None
