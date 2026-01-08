"""Listing schemas - public, partner, and admin variants."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


# ===== Public Schemas (NO address fields, NO admin notes) =====

class PublicListingPhoto(BaseModel):
    """Public listing photo."""
    url: str
    width: int
    height: int


class PublicListingCardResponse(BaseModel):
    """Public listing card (for list view)."""
    listingId: str
    slug: str
    displayName: str
    locality: str
    city: str
    workspaceTypes: List[str]
    photos: List[PublicListingPhoto]
    seatCapacityMin: int
    seatCapacityMax: int
    availabilityStatus: str
    budgetBandId: str
    budgetDisplayText: str
    pricingMode: str
    nearMetro: bool
    metroNote: Optional[str]
    parking: str
    powerBackup: bool
    gstInvoiceAvailable: bool
    accessHours: str
    weekendAccess: bool
    amenities: List[str]
    meetingRoomsAddon: bool
    dealTags: List[str]
    isVerified: bool  # True if verificationStatus == APPROVED_VERIFIED
    verifiedAt: Optional[datetime]  # publishedAt
    createdAt: datetime


class PublicListingDetailResponse(BaseModel):
    """Public listing detail (for detail page)."""
    listingId: str
    slug: str
    displayName: str
    locality: str
    city: str
    workspaceTypes: List[str]
    photos: List[PublicListingPhoto]
    seatCapacityMin: int
    seatCapacityMax: int
    availabilityStatus: str
    budgetBandId: str
    budgetDisplayText: str
    pricingMode: str
    nearMetro: bool
    metroNote: Optional[str]
    parking: str
    powerBackup: bool
    gstInvoiceAvailable: bool
    accessHours: str
    weekendAccess: bool
    amenities: List[str]
    meetingRooms: Optional[dict]  # {count, addonOnly}
    internetSpeedMbps: Optional[int]
    dealTags: List[str]
    dealDetails: Optional[str]
    dealEligibility: Optional[str]
    overview: str
    houseRules: Optional[str]
    isVerified: bool
    verifiedAt: Optional[datetime]
    createdAt: datetime


# ===== Partner Schemas =====

class ListingPhotoResponse(BaseModel):
    """Full listing photo with all fields."""
    url: str
    publicId: str
    width: int
    height: int
    bytes: int
    format: str
    tag: Optional[str]


class PartnerListingResponse(BaseModel):
    """Partner listing response (includes all fields)."""
    listingId: str
    slug: Optional[str]  # May be None until approved
    partnerId: str
    displayName: str
    brandHidden: bool
    locality: str
    city: str
    workspaceTypes: List[str]
    photos: List[ListingPhotoResponse]
    seatCapacityMin: int
    seatCapacityMax: int
    availabilityStatus: str
    budgetBandId: str
    budgetDisplayText: str
    pricingMode: str
    nearMetro: bool
    metroNote: Optional[str]
    parking: str
    powerBackup: bool
    gstInvoiceAvailable: bool
    accessHours: str
    weekendAccess: bool
    amenities: List[str]
    meetingRooms: Optional[dict]
    internetSpeedMbps: Optional[int]
    dealTags: List[str]
    dealDetails: Optional[str]
    dealEligibility: Optional[str]
    overview: str
    houseRules: Optional[str]
    verificationStatus: str
    adminNotes: Optional[str]  # Only visible to partner
    createdAt: datetime
    updatedAt: datetime
    publishedAt: Optional[datetime]


class ListingCreateRequest(BaseModel):
    """Create listing request."""
    displayName: str
    brandHidden: bool = False
    locality: str
    workspaceTypes: List[str]
    seatCapacityMin: int
    seatCapacityMax: int
    availabilityStatus: str
    budgetBandId: str
    budgetDisplayText: str
    nearMetro: bool = False
    metroNote: Optional[str] = None
    parking: str = "NONE"
    powerBackup: bool = False
    gstInvoiceAvailable: bool = False
    accessHours: str
    weekendAccess: bool = False
    amenities: List[str] = []
    meetingRoomsCount: Optional[int] = None
    meetingRoomsAddonOnly: bool = True
    internetSpeedMbps: Optional[int] = None
    dealTags: List[str] = []
    dealDetails: Optional[str] = None
    dealEligibility: Optional[str] = None
    overview: str
    houseRules: Optional[str] = None


class ListingUpdateRequest(BaseModel):
    """Update listing request."""
    displayName: Optional[str] = None
    brandHidden: Optional[bool] = None
    locality: Optional[str] = None
    workspaceTypes: Optional[List[str]] = None
    seatCapacityMin: Optional[int] = None
    seatCapacityMax: Optional[int] = None
    availabilityStatus: Optional[str] = None
    budgetBandId: Optional[str] = None
    budgetDisplayText: Optional[str] = None
    nearMetro: Optional[bool] = None
    metroNote: Optional[str] = None
    parking: Optional[str] = None
    powerBackup: Optional[bool] = None
    gstInvoiceAvailable: Optional[bool] = None
    accessHours: Optional[str] = None
    weekendAccess: Optional[bool] = None
    amenities: Optional[List[str]] = None
    meetingRoomsCount: Optional[int] = None
    meetingRoomsAddonOnly: Optional[bool] = None
    internetSpeedMbps: Optional[int] = None
    dealTags: Optional[List[str]] = None
    dealDetails: Optional[str] = None
    dealEligibility: Optional[str] = None
    overview: Optional[str] = None
    houseRules: Optional[str] = None


# ===== Admin Schemas =====

class AdminListingResponse(BaseModel):
    """Admin listing response (includes admin notes and verification checks)."""
    listingId: str
    slug: Optional[str]
    partnerId: str
    displayName: str
    brandHidden: bool
    locality: str
    city: str
    workspaceTypes: List[str]
    photos: List[ListingPhotoResponse]
    seatCapacityMin: int
    seatCapacityMax: int
    availabilityStatus: str
    budgetBandId: str
    budgetDisplayText: str
    pricingMode: str
    nearMetro: bool
    metroNote: Optional[str]
    parking: str
    powerBackup: bool
    gstInvoiceAvailable: bool
    accessHours: str
    weekendAccess: bool
    amenities: List[str]
    meetingRooms: Optional[dict]
    internetSpeedMbps: Optional[int]
    dealTags: List[str]
    dealDetails: Optional[str]
    dealEligibility: Optional[str]
    overview: str
    houseRules: Optional[str]
    verificationStatus: str
    adminNotes: Optional[str]  # Admin can see
    createdAt: datetime
    updatedAt: datetime
    publishedAt: Optional[datetime]
    verificationChecks: Optional[dict] = None  # Verification checklist


class VerificationUpdateRequest(BaseModel):
    """Update verification request."""
    checks: Optional[dict] = None
    notes: Optional[str] = None


class ApproveListingRequest(BaseModel):
    """Approve listing request."""
    notes: Optional[str] = None


class NeedsInfoRequest(BaseModel):
    """Needs info request (requires notes)."""
    notes: str


class RejectListingRequest(BaseModel):
    """Reject listing request (requires reason)."""
    reason: str
