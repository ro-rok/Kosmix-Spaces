"""Lead service - business logic for leads."""
from typing import Optional, Tuple, List
from datetime import datetime
from bson import ObjectId
from app.db.mongodb import get_database
from app.models.lead import EnquiryLead
from app.core.errors import NotFoundError


def build_whatsapp_link(
    name: str,
    phone: str,
    preferred_localities: list,
    budget_band: Optional[str] = None,
    team_size: Optional[str] = None,
    space_type: Optional[str] = None
) -> str:
    """Build WhatsApp deep link for lead."""
    message_parts = [f"Hi! I'm {name}"]
    
    if preferred_localities:
        message_parts.append(f"Looking for workspace in: {', '.join(preferred_localities)}")
    
    if team_size:
        message_parts.append(f"Team size: {team_size}")
    
    if budget_band:
        message_parts.append(f"Budget: {budget_band}")
    
    if space_type:
        message_parts.append(f"Space type: {space_type}")
    
    message = "%0A".join(message_parts)
    return f"https://wa.me/919876543210?text={message}"  # Replace with actual WhatsApp number


async def create_lead(lead_data: dict) -> dict:
    """Create a new enquiry lead."""
    db = get_database()
    
    lead_doc = {
        **lead_data,
        "_id": ObjectId(),
        "status": "NEW",
        "priority": "NORMAL",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db.leads.insert_one(lead_doc)
    lead_doc["_id"] = result.inserted_id
    
    # Update locality statistics for enquiries
    if "preferredLocalities" in lead_data and lead_data["preferredLocalities"]:
        from app.services.location_service import LocationService
        location_service = LocationService(db)
        
        for locality_name in lead_data["preferredLocalities"]:
            # Try to find the city for this locality (we'll use a simple approach)
            # In a real implementation, you might want to store city info with the lead
            city_name = "Delhi"  # Default, could be improved by looking up the locality
            await location_service.update_locality_stats(
                locality_name=locality_name,
                city_name=city_name,
                increment_enquiries=1
            )
    
    return lead_doc


async def get_lead(lead_id: str) -> Optional[dict]:
    """Get a lead by ID."""
    db = get_database()
    return await db.leads.find_one({"_id": ObjectId(lead_id)})


async def update_lead(lead_id: str, updates: dict) -> dict:
    """Update a lead."""
    db = get_database()
    updates["updatedAt"] = datetime.utcnow()
    
    result = await db.leads.find_one_and_update(
        {"_id": ObjectId(lead_id)},
        {"$set": updates},
        return_document=True
    )
    
    if not result:
        raise NotFoundError("Lead", lead_id)
    
    return result


async def list_leads(
    status: Optional[str] = None,
    locality: Optional[str] = None,
    page: int = 1,
    page_size: int = 50
) -> Tuple[List[dict], int]:
    """List leads with filters."""
    db = get_database()
    
    query = {}
    if status:
        query["status"] = status
    if locality:
        query["preferredLocalities"] = {"$in": [locality]}
    
    total = await db.leads.count_documents(query)
    skip = (page - 1) * page_size
    
    cursor = db.leads.find(query).sort("createdAt", -1).skip(skip).limit(page_size)
    leads = await cursor.to_list(length=page_size)
    
    return leads, total
