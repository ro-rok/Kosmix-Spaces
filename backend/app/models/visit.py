"""Site visit request models."""
from typing import List, Optional, Literal
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from app.models.common import TimestampMixin, PyObjectId


VisitStatus = Literal[
    "REQUESTED",
    "CONFIRMING_WITH_PARTNER",
    "CONFIRMED",
    "RESCHEDULE_NEEDED",
    "COMPLETED",
    "CANCELLED"
]
TimeWindow = Literal["morning", "afternoon", "evening"]


class PreferredSlot(BaseModel):
    """Preferred visit slot."""
    date: str  # ISO date string
    timeWindow: TimeWindow


class ConfirmedSlot(BaseModel):
    """Confirmed visit slot."""
    date: str  # ISO date string
    time: str  # Time string
    listingId: str


class SiteVisitRequest(TimestampMixin):
    """Site visit request model."""
    visitRequestId: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    leadId: PyObjectId
    listingIds: List[PyObjectId] = []
    
    preferredSlots: List[PreferredSlot] = []
    visitorCount: int = 1
    
    status: VisitStatus = "REQUESTED"
    confirmedSlot: Optional[ConfirmedSlot] = None
    
    opsOwner: Optional[str] = None
    partnerNotes: Optional[str] = None
    customerNotes: Optional[str] = None
    
    model_config = ConfigDict(populate_by_name=True)
