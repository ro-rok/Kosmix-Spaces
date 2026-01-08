"""Verification schemas."""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class VerificationChecksResponse(BaseModel):
    """Verification checks response."""
    partnerContactVerified: bool
    photosVerified: bool
    specsVerified: bool
    pricingStructureConfirmed: bool
    addressHidingConfirmed: bool


class AuditTrailEntryResponse(BaseModel):
    """Audit trail entry response."""
    action: str
    actorRole: str
    actorId: str
    timestamp: datetime
    diffSummary: Optional[str]
    notes: Optional[str]


class VerificationResponse(BaseModel):
    """Verification response."""
    verificationId: str
    entityType: str
    entityId: str
    checks: VerificationChecksResponse
    status: str
    notes: Optional[str]
    auditTrail: List[AuditTrailEntryResponse]
    createdAt: datetime
    updatedAt: datetime
