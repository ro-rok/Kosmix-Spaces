"""Verification service - business logic for verification workflow."""
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.db.mongodb import get_database
from app.models.verification import AdminVerification, AuditTrailEntry
from app.core.errors import NotFoundError


async def get_or_create_verification(listing_id: str) -> dict:
    """Get or create verification record for a listing."""
    db = get_database()
    
    verification = await db.verifications.find_one({
        "entityType": "LISTING",
        "entityId": ObjectId(listing_id)
    })
    
    if not verification:
        # Create new verification
        verification_doc = {
            "_id": ObjectId(),
            "entityType": "LISTING",
            "entityId": ObjectId(listing_id),
            "checks": {
                "partnerContactVerified": False,
                "photosVerified": False,
                "specsVerified": False,
                "pricingStructureConfirmed": False,
                "addressHidingConfirmed": False
            },
            "status": "PENDING_REVIEW",
            "notes": None,
            "auditTrail": [],
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        await db.verifications.insert_one(verification_doc)
        verification = verification_doc
    
    return verification


async def update_verification(
    listing_id: str,
    checks: Optional[Dict[str, bool]] = None,
    notes: Optional[str] = None
) -> dict:
    """Update verification checks and notes."""
    db = get_database()
    
    updates: Dict[str, Any] = {"updatedAt": datetime.utcnow()}
    
    if checks is not None:
        updates["checks"] = checks
    
    if notes is not None:
        updates["notes"] = notes
    
    result = await db.verifications.find_one_and_update(
        {"entityType": "LISTING", "entityId": ObjectId(listing_id)},
        {"$set": updates},
        return_document=True
    )
    
    if not result:
        raise NotFoundError("Verification", listing_id)
    
    return result


async def add_audit_entry(
    listing_id: str,
    action: str,
    actor_role: str,
    actor_id: str,
    notes: Optional[str] = None,
    diff_summary: Optional[str] = None
):
    """Add an audit trail entry."""
    db = get_database()
    
    audit_entry = {
        "action": action,
        "actorRole": actor_role,
        "actorId": actor_id,
        "timestamp": datetime.utcnow(),
        "notes": notes,
        "diffSummary": diff_summary
    }
    
    await db.verifications.update_one(
        {"entityType": "LISTING", "entityId": ObjectId(listing_id)},
        {"$push": {"auditTrail": audit_entry}, "$set": {"updatedAt": datetime.utcnow()}}
    )


async def approve_listing(listing_id: str, admin_id: str, notes: Optional[str] = None):
    """Approve a listing and set publishedAt."""
    db = get_database()
    now = datetime.utcnow()
    
    # Update premium listing
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {
            "$set": {
                "verificationStatus": "APPROVED_VERIFIED",
                "publishedAt": now,
                "isPublished": True,
                "updatedAt": now
            }
        }
    )
    
    # Update verification
    await db.verifications.update_one(
        {"entityType": "LISTING", "entityId": ObjectId(listing_id)},
        {
            "$set": {
                "status": "APPROVED",
                "notes": notes,
                "updatedAt": now
            }
        }
    )
    
    # Add audit entry
    await add_audit_entry(
        listing_id,
        "APPROVED",
        "admin",
        admin_id,
        notes=notes
    )


async def set_needs_info(listing_id: str, admin_id: str, notes: str):
    """Set listing status to NEEDS_INFO."""
    db = get_database()
    now = datetime.utcnow()
    
    # Update premium listing
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {
            "$set": {
                "verificationStatus": "NEEDS_INFO",
                "adminNotes": notes,
                "updatedAt": now
            }
        }
    )
    
    # Update verification
    await db.verifications.update_one(
        {"entityType": "LISTING", "entityId": ObjectId(listing_id)},
        {
            "$set": {
                "status": "NEEDS_INFO",
                "notes": notes,
                "updatedAt": now
            }
        }
    )
    
    # Add audit entry
    await add_audit_entry(
        listing_id,
        "NEEDS_INFO",
        "admin",
        admin_id,
        notes=notes
    )


async def reject_listing(listing_id: str, admin_id: str, reason: str):
    """Reject a listing."""
    db = get_database()
    now = datetime.utcnow()
    
    # Update premium listing
    await db.premium_listings.update_one(
        {"_id": ObjectId(listing_id)},
        {
            "$set": {
                "verificationStatus": "REJECTED",
                "adminNotes": reason,
                "updatedAt": now
            }
        }
    )
    
    # Update verification
    await db.verifications.update_one(
        {"entityType": "LISTING", "entityId": ObjectId(listing_id)},
        {
            "$set": {
                "status": "REJECTED",
                "notes": reason,
                "updatedAt": now
            }
        }
    )
    
    # Add audit entry
    await add_audit_entry(
        listing_id,
        "REJECTED",
        "admin",
        admin_id,
        notes=reason
    )
