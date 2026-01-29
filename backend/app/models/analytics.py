"""Analytics models for event tracking and reporting."""
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, Field
from bson import ObjectId

from .common import PyObjectId, TimestampMixin


class EventName(str, Enum):
    """Supported analytics event types."""
    PAGE_VIEW = "page_view"
    BUTTON_CLICK = "button_click"
    CTA_CLICK = "cta_click"
    LISTING_VIEW = "listing_view"
    LISTING_IMPRESSION = "listing_impression"
    LISTING_CARD_CLICK = "listing_card_click"
    EXPLORE_SEARCH = "explore_search"  # Alias for search_performed
    SEARCH_PERFORMED = "search_performed"
    FILTER_CHANGE = "filter_change"  # Alias for filter_applied
    FILTER_APPLIED = "filter_applied"
    ENQUIRY_SUBMIT = "enquiry_submit"
    WHATSAPP_CLICK = "whatsapp_click"
    CALL_CLICK = "call_click"
    EMAIL_CLICK = "email_click"
    FORM_SUBMIT = "form_submit"
    NAVIGATION_CLICK = "navigation_click"
    OUTBOUND_CLICK = "outbound_click"
    PARTNER_SIGNUP = "partner_signup"
    PARTNER_LOGIN = "partner_login"
    PARTNER_LISTING_SUBMITTED = "partner_listing_submitted"
    ADMIN_ACTION = "admin_action"
    ADMIN_VERIFICATION_ACTION = "admin_verification_action"


class UserRole(str, Enum):
    """User role types for analytics."""
    ANON = "anon"
    PARTNER = "partner"
    ADMIN = "admin"


class AnalyticsEvent(TimestampMixin):
    """Analytics event model for tracking user interactions."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    eventId: str = Field(..., description="Unique event identifier")
    eventName: EventName = Field(..., description="Type of event")
    timestamp: datetime = Field(..., description="Event timestamp")
    sessionId: str = Field(..., description="User session identifier")
    userRole: UserRole = Field(..., description="User role at time of event")
    
    # Context information (no PII)
    listingId: Optional[str] = Field(None, description="Associated listing ID")
    listingSlug: Optional[str] = Field(None, description="Associated listing slug")
    partnerId: Optional[str] = Field(None, description="Associated partner ID (for partner events)")
    
    # Navigation context
    referrer: Optional[str] = Field(None, description="Referrer URL")
    referrerDomain: Optional[str] = Field(None, description="Extracted domain from referrer")
    path: str = Field(..., description="Current page path")
    portal: Optional[str] = Field(None, description="Portal type: public/partner/admin")
    
    # UTM attribution (first-touch)
    utmSource: Optional[str] = Field(None, description="UTM source parameter")
    utmMedium: Optional[str] = Field(None, description="UTM medium parameter")
    utmCampaign: Optional[str] = Field(None, description="UTM campaign parameter")
    utmTerm: Optional[str] = Field(None, description="UTM term parameter")
    utmContent: Optional[str] = Field(None, description="UTM content parameter")
    
    # Device/viewport (no PII)
    deviceType: Optional[str] = Field(None, description="Device type: mobile/desktop/tablet")
    viewportWidth: Optional[int] = Field(None, description="Viewport width in pixels")
    viewportHeight: Optional[int] = Field(None, description="Viewport height in pixels")
    userAgent: Optional[str] = Field(None, description="Sanitized user agent (no fingerprinting)")
    
    # Session tracking
    isFirstTouch: bool = Field(default=False, description="First event in session")
    isLastTouch: bool = Field(default=False, description="Last event before conversion")
    
    # Event-specific metadata (no PII)
    metadata: Optional[Dict[str, Any]] = Field(None, description="Event-specific data")
    
    # Derived fields for analytics
    locality: Optional[str] = Field(None, description="Derived locality from listing")
    city: Optional[str] = Field(None, description="Derived city from listing")
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class AnalyticsEventCreate(BaseModel):
    """Schema for creating analytics events."""
    eventId: str
    eventName: EventName
    timestamp: datetime
    sessionId: str
    userRole: UserRole
    listingId: Optional[str] = None
    listingSlug: Optional[str] = None
    partnerId: Optional[str] = None
    referrer: Optional[str] = None
    referrerDomain: Optional[str] = None
    path: str
    portal: Optional[str] = None
    utmSource: Optional[str] = None
    utmMedium: Optional[str] = None
    utmCampaign: Optional[str] = None
    utmTerm: Optional[str] = None
    utmContent: Optional[str] = None
    deviceType: Optional[str] = None
    viewportWidth: Optional[int] = None
    viewportHeight: Optional[int] = None
    userAgent: Optional[str] = None
    isFirstTouch: bool = False
    isLastTouch: bool = False
    metadata: Optional[Dict[str, Any]] = None


class AnalyticsEventBatch(BaseModel):
    """Schema for batch event submission."""
    events: List[AnalyticsEventCreate] = Field(..., min_length=1, max_length=100)
    
    @classmethod
    def validate_batch_size(cls, v):
        """Validate batch size."""
        if len(v) > 100:
            raise ValueError("Maximum 100 events per batch")
        return v


class AnalyticsSummary(BaseModel):
    """Summary analytics data for admin dashboard."""
    totalViews: int = Field(..., description="Total listing views")
    totalEnquiries: int = Field(..., description="Total enquiries submitted")
    totalSearches: int = Field(..., description="Total searches performed")
    partnerSignups: int = Field(..., description="Total partner signups")
    conversionRate: float = Field(..., description="Views to enquiries conversion rate")
    
    topListings: List[Dict[str, Any]] = Field(default_factory=list, description="Top performing listings")
    topLocalities: List[Dict[str, Any]] = Field(default_factory=list, description="Most popular localities")
    timeSeries: Optional[List[Dict[str, Any]]] = Field(None, description="Time series data for charts")
    funnel: Optional[Dict[str, int]] = Field(None, description="Conversion funnel metrics")


class PartnerAnalytics(BaseModel):
    """Analytics data for partner dashboard."""
    views: int = Field(..., description="Total views for partner listings")
    enquiries: int = Field(..., description="Total enquiries for partner listings")
    whatsappClicks: int = Field(default=0, description="Total WhatsApp clicks")
    callClicks: int = Field(default=0, description="Total call clicks")
    conversionRate: float = Field(..., description="Views to enquiries conversion rate")
    topListings: List[Dict[str, Any]] = Field(default_factory=list, description="Partner's top performing listings")
    timeSeries: Optional[List[Dict[str, Any]]] = Field(None, description="Time series data for charts")
    trends: Optional[Dict[str, float]] = Field(None, description="Trend metrics (percentage changes)")


class AnalyticsFilter(BaseModel):
    """Filter parameters for analytics queries."""
    startDate: Optional[datetime] = None
    endDate: Optional[datetime] = None
    eventNames: Optional[List[EventName]] = None
    userRoles: Optional[List[UserRole]] = None
    localities: Optional[List[str]] = None
    partnerIds: Optional[List[str]] = None
    limit: int = Field(default=1000, ge=1, le=10000)
    offset: int = Field(default=0, ge=0)


class EventAggregation(BaseModel):
    """Aggregated event data."""
    eventName: EventName
    count: int
    uniqueSessions: int
    localities: List[str]
    timeRange: Dict[str, datetime]


class ListingPerformance(BaseModel):
    """Listing performance metrics."""
    listingId: str
    listingSlug: Optional[str] = None
    displayName: Optional[str] = None
    locality: Optional[str] = None
    views: int = 0
    enquiries: int = 0
    whatsappClicks: int = 0
    callClicks: int = 0
    conversionRate: float = 0.0
    lastActivity: Optional[datetime] = None


class LocalityPerformance(BaseModel):
    """Locality performance metrics."""
    locality: str
    city: Optional[str] = None
    searches: int = 0
    views: int = 0
    enquiries: int = 0
    uniqueListings: int = 0
    averageConversionRate: float = 0.0


class PartnerPerformance(BaseModel):
    """Partner performance metrics."""
    partnerId: str
    workspaceBrandName: Optional[str] = None
    totalListings: int = 0
    activeListings: int = 0
    totalViews: int = 0
    totalEnquiries: int = 0
    conversionRate: float = 0.0
    signupDate: Optional[datetime] = None
    lastActivity: Optional[datetime] = None


class TimeSeriesDataPoint(BaseModel):
    """Time series data point for analytics charts."""
    date: datetime
    views: int = 0
    enquiries: int = 0
    searches: int = 0
    clicks: int = 0


class AnalyticsTimeSeries(BaseModel):
    """Time series analytics data."""
    dataPoints: List[TimeSeriesDataPoint] = Field(default_factory=list)
    startDate: datetime
    endDate: datetime