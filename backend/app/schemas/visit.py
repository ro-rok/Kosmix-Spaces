"""Site visit schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class PreferredSlotCreate(BaseModel):
    """Preferred slot for visit request."""
    date: str  # ISO date string
    timeWindow: str  # morning | afternoon | evening


class SiteVisitCreate(BaseModel):
    """Create site visit request."""
    name: str
    phone: str
    email: Optional[str] = None
    listingIds: List[str]
    preferredSlots: List[PreferredSlotCreate]
    visitorCount: int = 1


class SiteVisitResponse(BaseModel):
    """Site visit response."""
    visitRequestId: str
    leadId: str
    listingIds: List[str]
    preferredSlots: List[dict]
    visitorCount: int
    status: str
    confirmedSlot: Optional[dict] = None
    opsOwner: Optional[str] = None
    partnerNotes: Optional[str] = None
    customerNotes: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime


class SiteVisitUpdate(BaseModel):
    """Update site visit request."""
    status: Optional[str] = None
    confirmedSlot: Optional[dict] = None
    opsOwner: Optional[str] = None
    partnerNotes: Optional[str] = None
    customerNotes: Optional[str] = None


class VisitCreateResponse(BaseModel):
    """Visit creation response."""
    visitRequestId: str
    message: str
