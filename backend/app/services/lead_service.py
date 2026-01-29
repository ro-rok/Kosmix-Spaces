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
    space_type: Optional[str] = None,
    listing_name: Optional[str] = None,
    listing_locality: Optional[str] = None
) -> str:
    """Build professional WhatsApp deep link for lead."""
    import urllib.parse
    
    # Budget band labels
    budget_labels = {
        "₹": "Under ₹10k",
        "₹₹": "₹10k - ₹25k",
        "₹₹₹": "₹25k+",
        "5k-10k": "₹5k - ₹10k",
        "10k-20k": "₹10k - ₹20k",
        "20k-40k": "₹20k - ₹40k",
        "40k-80k": "₹40k - ₹80k",
        "80k+": "₹80k+"
    }
    
    # Build professional message
    message = f"Hi Kosmix Spaces! 👋\n\n"
    
    # Context - listing or general enquiry
    if listing_name:
        message += f"I'm interested in: *{listing_name}*"
        if listing_locality:
            message += f" in {listing_locality}"
        message += ".\n\n"
    elif preferred_localities:
        localities_str = ", ".join(preferred_localities)
        message += f"I'm looking for a workspace in {localities_str}.\n\n"
    else:
        message += f"I'm looking for a workspace.\n\n"
    
    # Requirements section
    needs = []
    
    if team_size:
        needs.append(f"Team size: {team_size}")
    
    if budget_band:
        budget_label = budget_labels.get(budget_band, budget_band)
        needs.append(f"Budget: {budget_label}")
    
    if space_type:
        needs.append(f"Space type: {space_type}")
    
    if needs:
        message += "📋 Requirements:\n"
        for need in needs:
            message += f"• {need}\n"
        message += "\n"
    
    # Call to action
    message += "Please help me find the best options and schedule a visit."
    
    # Encode message for URL
    encoded_message = urllib.parse.quote(message)
    # WhatsApp number from contact config (should match frontend)
    whatsapp_number = "919555457457"  # Swati Kapoor - matches frontend config
    return f"https://wa.me/{whatsapp_number}?text={encoded_message}"


async def create_lead(lead_data: dict, session_id: Optional[str] = None) -> dict:
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
    
    # Store sessionId if provided (for location reveal)
    if session_id:
        lead_doc["sessionId"] = session_id
    
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
