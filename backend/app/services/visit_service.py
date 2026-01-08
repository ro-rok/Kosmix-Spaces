"""Visit service - business logic for site visits."""
from typing import Optional, List, Tuple
from datetime import datetime
from bson import ObjectId
from app.db.mongodb import get_database
from app.core.errors import NotFoundError


async def create_visit_request(visit_data: dict) -> dict:
    """Create a new site visit request."""
    db = get_database()
    
    visit_doc = {
        **visit_data,
        "_id": ObjectId(),
        "status": "REQUESTED",
        "createdAt": datetime.utcnow(),
        "updatedAt": datetime.utcnow()
    }
    
    result = await db.site_visits.insert_one(visit_doc)
    visit_doc["_id"] = result.inserted_id
    
    return visit_doc


async def get_visit_request(visit_id: str) -> Optional[dict]:
    """Get a visit request by ID."""
    db = get_database()
    return await db.site_visits.find_one({"_id": ObjectId(visit_id)})


async def update_visit_request(visit_id: str, updates: dict) -> dict:
    """Update a visit request."""
    db = get_database()
    updates["updatedAt"] = datetime.utcnow()
    
    result = await db.site_visits.find_one_and_update(
        {"_id": ObjectId(visit_id)},
        {"$set": updates},
        return_document=True
    )
    
    if not result:
        raise NotFoundError("SiteVisitRequest", visit_id)
    
    return result


async def list_visits(
    status: Optional[str] = None,
    lead_id: Optional[str] = None,
    page: int = 1,
    page_size: int = 50
) -> Tuple[List[dict], int]:
    """List visit requests with filters."""
    db = get_database()
    
    query = {}
    if status:
        query["status"] = status
    if lead_id:
        query["leadId"] = ObjectId(lead_id)
    
    total = await db.site_visits.count_documents(query)
    skip = (page - 1) * page_size
    
    cursor = db.site_visits.find(query).sort("createdAt", -1).skip(skip).limit(page_size)
    visits = await cursor.to_list(length=page_size)
    
    return visits, total
