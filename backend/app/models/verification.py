"""Admin verification models."""
from datetime import datetime
from typing import List, Optional, Literal
from bson import ObjectId
from pydantic import BaseModel, Field, ConfigDict
from app.models.common import TimestampMixin, PyObjectId


VerificationStatus = Literal[
    "PENDING_REVIEW",
    "NEEDS_INFO",
    "APPROVED",
    "REJECTED",
    "SUSPENDED"
]
ActorRole = Literal["admin", "partner", "system"]


class VerificationChecks(BaseModel):
    """Verification checklist."""
    partnerContactVerified: bool = False
    photosVerified: bool = False
    specsVerified: bool = False
    pricingStructureConfirmed: bool = False
    addressHidingConfirmed: bool = False


class AuditTrailEntry(BaseModel):
    """Audit trail entry."""
    action: str
    actorRole: ActorRole
    actorId: str
    timestamp: datetime
    diffSummary: Optional[str] = None
    notes: Optional[str] = None


class AdminVerification(TimestampMixin):
    """Admin verification model."""
    verificationId: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    entityType: str = "LISTING"
    entityId: PyObjectId  # listingId
    
    checks: VerificationChecks = Field(default_factory=VerificationChecks)
    status: VerificationStatus = "PENDING_REVIEW"
    notes: Optional[str] = None
    
    auditTrail: List[AuditTrailEntry] = []
    
    model_config = ConfigDict(populate_by_name=True)
