"""Lead schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr


class EnquiryLeadCreate(BaseModel):
    """Create enquiry lead request."""
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
    source: str = "website"
    listingSlug: Optional[str] = None


class EnquiryLeadResponse(BaseModel):
    """Enquiry lead response."""
    leadId: str
    name: str
    phone: str
    email: Optional[str]
    company: Optional[str]
    teamSizeBand: Optional[str]
    preferredLocalities: List[str]
    budgetBandId: Optional[str]
    spaceType: Optional[str]
    moveInTimeframe: Optional[str]
    meetingRoomsAddon: bool
    gstInvoiceRequired: bool
    parkingNeeded: bool
    powerBackupRequired: bool
    nearMetroPreferred: bool
    notes: Optional[str]
    source: str
    listingSlug: Optional[str]
    status: str
    assignedTo: Optional[str]
    priority: str
    createdAt: datetime
    updatedAt: datetime


class EnquiryLeadUpdate(BaseModel):
    """Update enquiry lead request."""
    status: Optional[str] = None
    assignedTo: Optional[str] = None
    priority: Optional[str] = None


class LeadCreateResponse(BaseModel):
    """Lead creation response."""
    leadId: str
    message: str
    whatsappDeepLink: str
