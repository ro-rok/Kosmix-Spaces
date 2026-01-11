"""Location models for cities and localities."""
from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, validator
from enum import Enum


class LocalityStatus(str, Enum):
    """Status of a locality."""
    PENDING = "PENDING"  # Newly added by partner, awaiting admin approval
    APPROVED = "APPROVED"  # Approved by admin, available for use
    REJECTED = "REJECTED"  # Rejected by admin


class City(BaseModel):
    """City model."""
    id: str  # e.g., "delhi", "gurugram", "noida"
    name: str  # e.g., "Delhi", "Gurugram", "Noida"
    displayName: str  # e.g., "Delhi", "Gurugram", "Noida"
    isActive: bool = True
    metroAvailable: bool = False
    createdAt: datetime
    updatedAt: datetime


class Locality(BaseModel):
    """Locality model with city relationship."""
    id: str  # e.g., "connaught-place", "cyber-city"
    name: str  # e.g., "Connaught Place", "Cyber City"
    displayName: str  # e.g., "Connaught Place", "Cyber City"
    cityId: str  # Reference to city.id
    cityName: str  # Denormalized city name for easier queries
    
    # Status and approval
    status: LocalityStatus = LocalityStatus.PENDING
    
    # Metadata
    popular: bool = False  # Marked as popular by admin
    metroConnected: bool = False
    metroNote: Optional[str] = None
    
    # Tracking
    addedBy: Optional[str] = None  # Partner ID who added this locality
    addedByType: str = "SYSTEM"  # "SYSTEM", "PARTNER", "ADMIN"
    approvedBy: Optional[str] = None  # Admin ID who approved
    approvedAt: Optional[datetime] = None
    rejectedBy: Optional[str] = None  # Admin ID who rejected
    rejectedAt: Optional[datetime] = None
    rejectionReason: Optional[str] = None
    
    # Usage statistics
    listingCount: int = 0  # Number of listings in this locality
    enquiryCount: int = 0  # Number of enquiries for this locality
    
    # Timestamps
    createdAt: datetime
    updatedAt: datetime
    
    @validator('id')
    def validate_id_format(cls, v):
        """Validate locality ID format (lowercase, hyphenated)."""
        if not v.replace('-', '').replace('_', '').isalnum():
            raise ValueError('Locality ID must contain only alphanumeric characters, hyphens, and underscores')
        if v != v.lower():
            raise ValueError('Locality ID must be lowercase')
        return v


class LocalityRequest(BaseModel):
    """Request to add a new locality."""
    name: str
    cityId: str
    metroConnected: bool = False
    metroNote: Optional[str] = None
    addedBy: str  # Partner ID
    
    @validator('name')
    def validate_name(cls, v):
        """Validate locality name."""
        v = v.strip()
        if len(v) < 2:
            raise ValueError('Locality name must be at least 2 characters')
        if len(v) > 100:
            raise ValueError('Locality name must be less than 100 characters')
        return v


class LocalityApprovalRequest(BaseModel):
    """Request to approve/reject a locality."""
    localityId: str
    action: str  # "APPROVE" or "REJECT"
    rejectionReason: Optional[str] = None
    popular: bool = False  # Mark as popular when approving
    
    @validator('action')
    def validate_action(cls, v):
        """Validate approval action."""
        if v not in ["APPROVE", "REJECT"]:
            raise ValueError('Action must be APPROVE or REJECT')
        return v


class LocalitySearchResponse(BaseModel):
    """Response for locality search/listing."""
    localities: List[Locality]
    totalCount: int
    approvedCount: int
    pendingCount: int
    rejectedCount: int


class LocalitiesByCityResponse(BaseModel):
    """Response for localities grouped by city."""
    by_city: dict  # City ID -> List[Locality]
    flat: List[Locality]  # Flat list for backward compatibility
    cities: List[City]  # Available cities