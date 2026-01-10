"""Design system and UI configuration models."""
from datetime import datetime
from typing import Optional, Dict, Any, List, Literal
from pydantic import BaseModel, Field
from bson import ObjectId

from .common import PyObjectId, TimestampMixin


# Design system theme types
ThemeMode = Literal["light", "dark", "auto"]
AnimationLevel = Literal["none", "reduced", "full"]
DensityLevel = Literal["compact", "comfortable", "spacious"]


class DesignTokens(BaseModel):
    """Design system tokens configuration."""
    # Color tokens
    primaryColor: str = "#2D9A87"  # Default teal
    primaryGlow: str = "#3DB396"
    successColor: str = "#16A34A"
    whatsappColor: str = "#25D366"
    callColor: str = "#3B82F6"
    
    # Typography tokens
    fontFamily: str = "DM Sans"
    displayFontFamily: str = "Space Grotesk"
    
    # Spacing tokens
    baseSpacing: int = 4  # 4px base unit
    borderRadius: int = 12  # 0.75rem default
    
    # Shadow tokens
    shadowIntensity: float = 1.0  # Multiplier for shadow opacity
    
    # Animation tokens
    animationDuration: int = 200  # Base animation duration in ms
    animationEasing: str = "cubic-bezier(0.16, 1, 0.3, 1)"


class UIPreferences(BaseModel):
    """User interface preferences."""
    theme: ThemeMode = "light"
    animationLevel: AnimationLevel = "full"
    density: DensityLevel = "comfortable"
    
    # Feature flags
    enableGlassEffects: bool = True
    enableMicroInteractions: bool = True
    enableSkeletonShimmer: bool = True
    enableStickyElements: bool = True
    
    # Mobile preferences
    enableMobileOptimizations: bool = True
    enableSwipeGestures: bool = True
    enableHapticFeedback: bool = False
    
    # Accessibility preferences
    reduceMotion: bool = False
    highContrast: bool = False
    largeText: bool = False
    screenReaderOptimized: bool = False


class ComponentConfiguration(BaseModel):
    """Configuration for specific UI components."""
    # Card components
    cardStyle: Literal["flat", "elevated", "outlined"] = "elevated"
    cardHoverEffect: bool = True
    
    # Button components
    buttonStyle: Literal["filled", "outlined", "text"] = "filled"
    buttonRounding: Literal["square", "rounded", "pill"] = "rounded"
    
    # Navigation
    stickyNavigation: bool = True
    navigationStyle: Literal["minimal", "standard", "prominent"] = "standard"
    
    # Tables
    tableStyle: Literal["minimal", "bordered", "striped"] = "minimal"
    responsiveTableBreakpoint: int = 768  # px
    
    # Forms
    formStyle: Literal["minimal", "outlined", "filled"] = "outlined"
    realTimeValidation: bool = True
    
    # Loading states
    loadingStyle: Literal["spinner", "skeleton", "dots", "pulse"] = "skeleton"
    skeletonAnimation: bool = True


class DesignSystemConfig(TimestampMixin):
    """Complete design system configuration."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    
    # Configuration metadata
    name: str = "Premium Workspace Platform"
    version: str = "1.0.0"
    description: Optional[str] = None
    
    # Design tokens
    tokens: DesignTokens = Field(default_factory=DesignTokens)
    
    # UI preferences
    preferences: UIPreferences = Field(default_factory=UIPreferences)
    
    # Component configuration
    components: ComponentConfiguration = Field(default_factory=ComponentConfiguration)
    
    # Custom CSS overrides
    customCSS: Optional[str] = None
    
    # Feature flags
    features: Dict[str, bool] = Field(default_factory=dict)
    
    # Environment-specific settings
    environment: Literal["development", "staging", "production"] = "production"
    
    # Last updated by
    updatedBy: Optional[str] = None  # Admin user ID
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class UserDesignPreferences(TimestampMixin):
    """User-specific design preferences."""
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    
    # User identification
    userId: str  # Can be partner ID, admin ID, or session ID for anonymous users
    userType: Literal["partner", "admin", "anonymous"] = "anonymous"
    
    # Preferences
    preferences: UIPreferences = Field(default_factory=UIPreferences)
    
    # Device-specific preferences
    devicePreferences: Dict[str, UIPreferences] = Field(default_factory=dict)
    
    # Last active device
    lastDevice: Optional[str] = None
    
    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}


class DesignSystemMetrics(BaseModel):
    """Metrics for design system usage and performance."""
    # Usage metrics
    totalUsers: int = 0
    activeUsers: int = 0
    
    # Theme preferences
    lightModeUsers: int = 0
    darkModeUsers: int = 0
    autoModeUsers: int = 0
    
    # Animation preferences
    fullAnimationUsers: int = 0
    reducedAnimationUsers: int = 0
    noAnimationUsers: int = 0
    
    # Accessibility metrics
    highContrastUsers: int = 0
    largeTextUsers: int = 0
    screenReaderUsers: int = 0
    reducedMotionUsers: int = 0
    
    # Performance metrics
    averageLoadTime: float = 0.0
    averageInteractionTime: float = 0.0
    
    # Component usage
    componentUsage: Dict[str, int] = Field(default_factory=dict)
    
    # Error rates
    cssErrorRate: float = 0.0
    jsErrorRate: float = 0.0
    
    # Last updated
    lastUpdated: datetime = Field(default_factory=datetime.utcnow)


# Request/Response models
class DesignSystemConfigUpdate(BaseModel):
    """Request model for updating design system configuration."""
    name: Optional[str] = None
    description: Optional[str] = None
    tokens: Optional[DesignTokens] = None
    preferences: Optional[UIPreferences] = None
    components: Optional[ComponentConfiguration] = None
    customCSS: Optional[str] = None
    features: Optional[Dict[str, bool]] = None


class UserPreferencesUpdate(BaseModel):
    """Request model for updating user preferences."""
    preferences: Optional[UIPreferences] = None
    device: Optional[str] = None


class DesignSystemResponse(BaseModel):
    """Response model for design system configuration."""
    config: DesignSystemConfig
    userPreferences: Optional[UserDesignPreferences] = None
    metrics: Optional[DesignSystemMetrics] = None


class ComponentThemeOverride(BaseModel):
    """Theme override for specific components."""
    componentType: str  # e.g., "button", "card", "table"
    componentId: Optional[str] = None  # Specific component instance
    
    # Style overrides
    styles: Dict[str, Any] = Field(default_factory=dict)
    
    # Conditional overrides
    conditions: Dict[str, Any] = Field(default_factory=dict)  # e.g., {"viewport": "mobile"}
    
    # Priority
    priority: int = 0  # Higher priority overrides lower priority


class DesignSystemAnalytics(BaseModel):
    """Analytics data for design system performance."""
    # Performance metrics
    cssLoadTime: float = 0.0
    jsLoadTime: float = 0.0
    renderTime: float = 0.0
    
    # User interaction metrics
    buttonClickRate: float = 0.0
    formCompletionRate: float = 0.0
    navigationUsage: Dict[str, int] = Field(default_factory=dict)
    
    # Error tracking
    cssErrors: List[str] = Field(default_factory=list)
    jsErrors: List[str] = Field(default_factory=list)
    
    # Browser compatibility
    browserSupport: Dict[str, float] = Field(default_factory=dict)
    
    # Accessibility metrics
    accessibilityScore: float = 0.0
    keyboardNavigationUsage: float = 0.0
    screenReaderUsage: float = 0.0
    
    # Timestamp
    timestamp: datetime = Field(default_factory=datetime.utcnow)