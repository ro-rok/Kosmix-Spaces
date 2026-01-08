"""Workspace listing models."""
from datetime import datetime
from typing import List, Optional, Literal
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from app.models.common import TimestampMixin, PyObjectId


class ListingPhoto(BaseModel):
    """Listing photo model."""
    url: str
    publicId: str
    width: int
    height: int
    bytes: int
    format: str
    tag: Optional[str] = None


class SeatCapacity(BaseModel):
    """Seat capacity range."""
    minSeats: int
    maxSeats: int


class MeetingRooms(BaseModel):
    """Meeting rooms configuration."""
    count: int
    addonOnly: bool = True


WorkspaceType = Literal["DEDICATED_DESKS", "PRIVATE_CABINS", "MANAGED_OFFICE", "MEETING_ROOMS_ADDON"]
AvailabilityStatus = Literal["AVAILABLE", "LIMITED", "WAITLIST"]
ParkingType = Literal["NONE", "TWO_WHEELER", "FOUR_WHEELER", "BOTH"]
VerificationStatus = Literal[
    "PENDING_REVIEW",
    "NEEDS_INFO",
    "APPROVED_VERIFIED",
    "REJECTED",
    "SUSPENDED"
]


class WorkspaceListing(TimestampMixin):
    """Workspace listing model (internal)."""
    listingId: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    slug: str  # Unique
    partnerId: PyObjectId
    displayName: str
    brandHidden: bool = False
    locality: str
    city: str = "Delhi"
    # NOTE: exactAddress is stored internally but NEVER returned in public APIs
    exactAddress: Optional[str] = None  # Internal only, not in public responses
    
    workspaceTypes: List[WorkspaceType]
    photos: List[ListingPhoto] = []
    
    seatCapacity: SeatCapacity
    availabilityStatus: AvailabilityStatus
    
    budgetBandId: str
    budgetDisplayText: str
    pricingMode: str = "ON_ENQUIRY"
    
    nearMetro: bool = False
    metroNote: Optional[str] = None  # Safe, no address
    
    parking: ParkingType = "NONE"
    powerBackup: bool = False
    gstInvoiceAvailable: bool = False
    
    accessHours: str
    weekendAccess: bool = False
    
    amenities: List[str] = []
    meetingRooms: Optional[MeetingRooms] = None
    internetSpeedMbps: Optional[int] = None
    
    dealTags: List[str] = []
    dealDetails: Optional[str] = None
    dealEligibility: Optional[str] = None
    
    overview: str
    houseRules: Optional[str] = None
    
    verificationStatus: VerificationStatus = "PENDING_REVIEW"
    adminNotes: Optional[str] = None  # Internal only
    
    publishedAt: Optional[datetime] = None
    
    model_config = ConfigDict(populate_by_name=True)
