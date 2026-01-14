"""Enhanced premium workspace listing models."""
from datetime import datetime
from typing import List, Optional, Dict, Any, Literal
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict, validator
from app.models.common import TimestampMixin, PyObjectId


# Enhanced offering types for premium platform
OfferingType = Literal[
    "private-offices",
    "dedicated-desks", 
    "hot-desks",
    "meeting-rooms",
    "event-spaces"
]

PricingUnit = Literal["month", "hr", "day", "NA"]
BudgetBand = Literal["₹", "₹₹", "₹₹₹"]


class HeroPhoto(BaseModel):
    """Hero photo for listing with compression metadata."""
    url: str
    publicId: str
    width: int
    height: int
    bytes: int
    format: str
    order: int = 0  # For photo ordering
    
    # Compression metadata
    compressionRatio: Optional[int] = 0  # Percentage compression achieved
    originalSize: Optional[int] = None  # Original file size in bytes
    variants: Optional[Dict[str, str]] = {}  # Different size variants (thumbnail, mobile, etc.)
    
    # Upload metadata
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []  # Cloudinary tags for organization


class OfferingPhoto(BaseModel):
    """Photo specific to an offering with compression metadata."""
    url: str
    publicId: str
    width: int
    height: int
    bytes: int
    format: str
    offeringType: OfferingType
    order: int = 0  # For photo ordering within offering
    
    # Compression metadata
    compressionRatio: Optional[int] = 0  # Percentage compression achieved
    originalSize: Optional[int] = None  # Original file size in bytes
    variants: Optional[Dict[str, str]] = {}  # Different size variants (thumbnail, mobile, etc.)
    
    # Upload metadata
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)
    tags: List[str] = []  # Cloudinary tags for organization


class PremiumOffering(BaseModel):
    """Premium offering model with enhanced features."""
    type: OfferingType
    title: str
    description: str = ""
    features: List[str] = []
    enabled: bool = False
    
    # Pricing information
    startingPrice: Optional[int] = None  # In rupees
    unit: Optional[PricingUnit] = None
    budgetBand: Optional[BudgetBand] = None
    
    # Photos specific to this offering
    photos: List[OfferingPhoto] = []
    
    # Capacity and availability
    capacity: Optional[Dict[str, Any]] = None  # Flexible capacity info
    availability: Optional[str] = None


class LocationData(BaseModel):
    """Enhanced location model with privacy protection."""
    locality: str
    city: str = "Delhi"
    
    # Approximate coordinates (rounded for privacy)
    approximateCoordinates: Optional[Dict[str, float]] = None
    
    # Internal exact address (never exposed in public APIs)
    exactAddress: Optional[str] = None  # Internal only
    
    # Access and hours
    accessHours: Optional[str] = "9 AM - 9 PM"
    customAccessHours: Optional[str] = None
    weekendAccess: bool = False
    twentyFourSevenAccess: bool = False
    
    # Transportation
    nearMetro: bool = False
    metroNote: Optional[str] = None  # Safe description, no exact address
    metroDetails: Optional[str] = None
    parking: Optional[str] = "NONE"
    parkingNotes: Optional[str] = None
    
    # Infrastructure
    powerBackup: bool = False
    internetSpeedMbps: Optional[int] = None
    wifiDetails: Optional[str] = None
    
    # Additional information
    houseRules: Optional[str] = None
    specialInstructions: Optional[str] = None
    
    @validator('approximateCoordinates')
    def round_coordinates(cls, v):
        """Round coordinates to 2 decimal places for privacy."""
        if v and 'lat' in v and 'lng' in v:
            return {
                'lat': round(v['lat'], 2),
                'lng': round(v['lng'], 2)
            }
        return v


class SlugData(BaseModel):
    """Slug generation and collision handling."""
    slug: str
    partnerSlug: str
    localitySlug: str
    nameSlug: str
    hashSuffix: Optional[str] = None  # Added when collision occurs
    
    @validator('slug')
    def validate_slug_format(cls, v):
        """Validate slug follows the expected format."""
        if not v.startswith('/listing/'):
            raise ValueError('Slug must start with /listing/')
        parts = v.split('/')
        if len(parts) < 5:  # ['', 'listing', 'partner', 'locality', 'name']
            raise ValueError('Slug must have partner, locality, and name components')
        return v


class VerificationChecks(BaseModel):
    """Admin verification checks."""
    photosQuality: Optional[bool] = None
    contactVerified: Optional[bool] = None
    locationAccurate: Optional[bool] = None
    offeringsValid: Optional[bool] = None
    pricingReasonable: Optional[bool] = None


class SEOMetadata(BaseModel):
    """SEO metadata for listing optimization."""
    metaTitle: str
    metaDescription: str
    keywords: List[str] = []
    ogTitle: str
    ogDescription: str
    ogImage: Optional[str] = None
    twitterCard: str = "summary_large_image"
    twitterTitle: str
    twitterDescription: str
    twitterImage: Optional[str] = None
    canonicalUrl: str
    autoGenerated: bool = True
    lastUpdated: datetime = Field(default_factory=datetime.utcnow)


class PremiumWorkspaceListing(TimestampMixin):
    """Enhanced premium workspace listing model."""
    listingId: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    partnerId: PyObjectId
    
    # Basic information
    displayName: str
    overview: str
    
    # Slug management
    slugData: SlugData
    
    # Location with privacy protection
    location: LocationData
    
    # Five offering types
    offerings: Dict[OfferingType, PremiumOffering] = {}
    
    # Global listing photos (not offering-specific)
    heroPhotos: List[OfferingPhoto] = []
    
    # Amenities and features
    amenities: List[str] = []
    highlights: List[str] = []
    
    # Trust and verification
    verificationStatus: Literal[
        "PENDING",
        "APPROVED",
        "REJECTED",
        "PENDING_REVIEW",
        "NEEDS_INFO",
        "APPROVED_VERIFIED"
    ] = "PENDING"
    
    verificationChecks: Optional[VerificationChecks] = None
    adminNotes: Optional[str] = None
    
    # Publishing
    publishedAt: Optional[datetime] = None
    isPublished: bool = False
    
    # Analytics tracking
    viewCount: int = 0
    enquiryCount: int = 0
    lastViewedAt: Optional[datetime] = None
    
    # SEO metadata
    seoMetadata: Optional[SEOMetadata] = None
    
    model_config = ConfigDict(populate_by_name=True)
    
    @validator('offerings')
    def validate_offerings(cls, v):
        """Ensure all offering types are present."""
        required_types: List[OfferingType] = [
            "private-offices",
            "dedicated-desks", 
            "hot-desks",
            "meeting-rooms",
            "event-spaces"
        ]
        
        for offering_type in required_types:
            if offering_type not in v:
                # Initialize with default offering
                v[offering_type] = PremiumOffering(
                    type=offering_type,
                    title=cls._get_default_title(offering_type),
                    enabled=False
                )
        
        return v
    
    @staticmethod
    def _get_default_title(offering_type: OfferingType) -> str:
        """Get default title for offering type."""
        titles = {
            "private-offices": "Private Offices",
            "dedicated-desks": "Dedicated Desks",
            "hot-desks": "Hot Desks", 
            "meeting-rooms": "Meeting Rooms",
            "event-spaces": "Event Spaces"
        }
        return titles.get(offering_type, offering_type.replace("-", " ").title())


class ListingSubmissionValidation(BaseModel):
    """Validation result for listing submission."""
    isValid: bool
    errors: List[str] = []
    warnings: List[str] = []
    
    def add_error(self, message: str):
        """Add validation error."""
        self.errors.append(message)
        self.isValid = False
    
    def add_warning(self, message: str):
        """Add validation warning."""
        self.warnings.append(message)


# Request/Response models for API
class PremiumListingCreate(BaseModel):
    """Request model for creating premium listing."""
    displayName: str
    overview: str
    locality: str
    city: str = "Delhi"
    exactAddress: Optional[str] = None
    nearMetro: bool = False
    metroNote: Optional[str] = None
    amenities: List[str] = []
    highlights: List[str] = []
    accessHours: Optional[str] = "9 AM - 9 PM"
    weekendAccess: bool = False


class PremiumListingUpdate(BaseModel):
    """Request model for updating premium listing."""
    displayName: Optional[str] = None
    overview: Optional[str] = None
    locality: Optional[str] = None
    city: Optional[str] = None
    exactAddress: Optional[str] = None
    nearMetro: Optional[bool] = None
    metroNote: Optional[str] = None
    amenities: Optional[List[str]] = None
    highlights: Optional[List[str]] = None
    offerings: Optional[Dict[OfferingType, PremiumOffering]] = None
    accessHours: Optional[str] = None
    weekendAccess: Optional[bool] = None
    # Location fields
    approximateCoordinates: Optional[Dict[str, float]] = None
    customAccessHours: Optional[str] = None
    twentyFourSevenAccess: Optional[bool] = None
    metroDetails: Optional[str] = None
    parking: Optional[str] = None
    parkingNotes: Optional[str] = None
    powerBackup: Optional[bool] = None
    internetSpeedMbps: Optional[int] = None
    wifiDetails: Optional[str] = None
    houseRules: Optional[str] = None
    specialInstructions: Optional[str] = None


class OfferingUpdateRequest(BaseModel):
    """Request model for updating a specific offering."""
    title: Optional[str] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    enabled: Optional[bool] = None
    startingPrice: Optional[int] = None
    unit: Optional[PricingUnit] = None
    budgetBand: Optional[BudgetBand] = None
    capacity: Optional[Dict[str, Any]] = None
    availability: Optional[str] = None


class PhotoUploadResponse(BaseModel):
    """Response model for photo upload."""
    url: str
    publicId: str
    width: int
    height: int
    bytes: int
    format: str
    offeringType: OfferingType
    order: int


class TempPhotoUploadResponse(BaseModel):
    """Response model for temporary photo upload."""
    url: str
    publicId: str
    width: int
    height: int
    bytes: int
    format: str


class MoveTempPhotosRequest(BaseModel):
    """Request model for moving temporary photos to permanent listing."""
    temp_photos: List[str]  # List of temporary photo public IDs
    offering_type: Optional[str] = None  # Target offering type, None for hero photos