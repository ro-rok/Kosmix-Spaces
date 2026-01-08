"""Partner schemas."""
from pydantic import BaseModel, EmailStr
from typing import Optional


class PartnerRegisterRequest(BaseModel):
    """Partner registration request."""
    workspaceBrandName: str
    contactName: str
    phone: str
    email: EmailStr
    password: str


class PartnerResponse(BaseModel):
    """Partner response."""
    partnerId: str
    workspaceBrandName: str
    contactName: str
    phone: str
    email: str
    status: str


class PartnerMeResponse(BaseModel):
    """Current partner info."""
    partnerId: str
    workspaceBrandName: str
    contactName: str
    phone: str
    email: str
    status: str
