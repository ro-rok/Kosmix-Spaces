"""Enquiry lead models."""
from typing import List, Optional, Literal
from bson import ObjectId
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.models.common import TimestampMixin, PyObjectId


LeadStatus = Literal[
    "NEW",
    "QUALIFYING",
    "VISIT_REQUESTED",
    "VISIT_SCHEDULED",
    "QUOTE_SENT",
    "BOOKED",
    "LOST",
    "SPAM"
]
Priority = Literal["URGENT", "NORMAL"]


class EnquiryLead(TimestampMixin):
    """Enquiry lead model."""
    leadId: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    name: str
    phone: str
    email: Optional[EmailStr] = None
    company: Optional[str] = None
    
    teamSizeBand: Optional[str] = None
    preferredLocalities: List[str] = []
    budgetBandId: Optional[str] = None
    
    spaceType: Optional[str] = None
    moveInTimeframe: Optional[str] = None
    
    meetingRoomsAddon: bool = False
    gstInvoiceRequired: bool = False
    parkingNeeded: bool = False
    powerBackupRequired: bool = False
    nearMetroPreferred: bool = False
    
    notes: Optional[str] = None
    source: str
    listingSlug: Optional[str] = None
    
    status: LeadStatus = "NEW"
    assignedTo: Optional[str] = None
    priority: Priority = "NORMAL"
    
    model_config = ConfigDict(populate_by_name=True)
