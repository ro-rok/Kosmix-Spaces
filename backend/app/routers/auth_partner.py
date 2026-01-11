"""Partner authentication routes."""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    require_partner
)
from app.core.config import get_settings
from app.schemas.auth import PartnerLoginRequest, TokenResponse
from app.schemas.partner import PartnerRegisterRequest, PartnerResponse, PartnerMeResponse
from app.db.mongodb import get_database
from app.core.errors import UnauthorizedError, ConflictError
from bson import ObjectId
from datetime import datetime

router = APIRouter()
settings = get_settings()


@router.post("/register", response_model=PartnerResponse)
async def register_partner(partner: PartnerRegisterRequest):
    """Register a new partner account."""
    db = get_database()
    
    try:
        # Check if email already exists
        existing = await db.partners.find_one({"email": partner.email})
        if existing:
            raise ConflictError("Email already registered")
        
        # Hash password
        password_hash = hash_password(partner.password)
        
        # Create partner account
        partner_doc = {
            "_id": ObjectId(),
            "workspaceBrandName": partner.workspaceBrandName,
            "contactName": partner.contactName,
            "phone": partner.phone,
            "email": partner.email,
            "passwordHash": password_hash,
            "status": "PENDING",
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        result = await db.partners.insert_one(partner_doc)
        
        return PartnerResponse(
            partnerId=str(partner_doc["_id"]),
            workspaceBrandName=partner_doc["workspaceBrandName"],
            contactName=partner_doc["contactName"],
            phone=partner_doc["phone"],
            email=partner_doc["email"],
            status=partner_doc["status"]
        )
    except ConflictError:
        raise
    except Exception as e:
        print(f"Error in partner registration: {e}")
        raise HTTPException(status_code=500, detail="Registration failed")


@router.post("/login", response_model=TokenResponse)
async def login_partner(credentials: PartnerLoginRequest):
    """Partner login."""
    db = get_database()
    
    # Try case-insensitive email search first
    partner = await db.partners.find_one({"email": {"$regex": f"^{credentials.email}$", "$options": "i"}})
    if not partner:
        raise UnauthorizedError("Account not found. Please check your email or register.")
    
    if not verify_password(credentials.password, partner["passwordHash"]):
        raise UnauthorizedError("Wrong password")
    
    if partner["status"] not in ["ACTIVE", "PENDING"]:
        status_messages = {
            "SUSPENDED": "Account has been suspended. Please contact support.",
        }
        message = status_messages.get(partner["status"], f"Account status is '{partner['status']}'. Please contact support.")
        raise UnauthorizedError(message)
    
    # Create JWT token
    token_data = {
        "sub": partner["email"],
        "role": "PARTNER",
        "partnerId": str(partner["_id"])
    }
    access_token = create_access_token(token_data)
    
    return TokenResponse(accessToken=access_token)


@router.post("/logout")
async def logout_partner():
    """Partner logout (frontend-only, just return ok)."""
    return {"ok": True}


@router.get("/me", response_model=PartnerMeResponse)
async def get_partner_me(current_user: dict = Depends(require_partner)):
    """Get current partner info."""
    db = get_database()
    partner_id = current_user["partnerId"]
    
    partner = await db.partners.find_one({"_id": ObjectId(partner_id)})
    if not partner:
        raise HTTPException(status_code=404, detail="Partner not found")
    
    return PartnerMeResponse(
        partnerId=str(partner["_id"]),
        workspaceBrandName=partner["workspaceBrandName"],
        contactName=partner["contactName"],
        phone=partner["phone"],
        email=partner["email"],
        status=partner["status"]
    )
