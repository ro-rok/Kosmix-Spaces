"""Location service for managing cities and localities."""
import re
from typing import List, Optional, Dict, Any
from datetime import datetime
from pymongo.database import Database
from pymongo import ASCENDING, DESCENDING
from bson import ObjectId

from app.models.location import (
    City, Locality, LocalityRequest, LocalityApprovalRequest,
    LocalityStatus, LocalitySearchResponse, LocalitiesByCityResponse
)
from app.db.indexes import safe_create_index


class LocationService:
    """Service for managing cities and localities."""
    
    def __init__(self, db: Database):
        self.db = db
        self.cities_collection = db.cities
        self.localities_collection = db.localities
        
        # Note: Indexes are created by the main index creation system
        # to avoid conflicts with existing indexes
    
    async def _ensure_indexes_async(self):
        """Ensure required indexes exist using safe creation."""
        # Cities indexes
        await safe_create_index(self.cities_collection, "id", unique=True)
        await safe_create_index(self.cities_collection, "name")
        
        # Localities indexes
        await safe_create_index(self.localities_collection, "id", unique=True)
        await safe_create_index(self.localities_collection, "cityId")
        await safe_create_index(self.localities_collection, "status")
        await safe_create_index(self.localities_collection, "name")
        await safe_create_index(self.localities_collection, [("cityId", ASCENDING), ("status", ASCENDING)])
        await safe_create_index(self.localities_collection, [("popular", DESCENDING), ("listingCount", DESCENDING)])
    
    async def _generate_locality_id(self, name: str, city_id: str) -> str:
        """Generate a unique locality ID from name and city."""
        # Convert to lowercase and replace spaces/special chars with hyphens
        base_id = re.sub(r'[^a-zA-Z0-9\s]', '', name.lower())
        base_id = re.sub(r'\s+', '-', base_id.strip())
        
        # Check if ID already exists
        counter = 0
        locality_id = base_id
        while await self.localities_collection.find_one({"id": locality_id}):
            counter += 1
            locality_id = f"{base_id}-{counter}"
        
        return locality_id
    
    async def initialize_default_data(self):
        """Initialize default cities and localities if they don't exist."""
        # Check if cities already exist
        if await self.cities_collection.count_documents({}) > 0:
            return
        
        # Default cities
        default_cities = [
            {
                "id": "delhi",
                "name": "Delhi",
                "displayName": "Delhi",
                "isActive": True,
                "metroAvailable": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "id": "gurugram",
                "name": "Gurugram",
                "displayName": "Gurugram",
                "isActive": True,
                "metroAvailable": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            },
            {
                "id": "noida",
                "name": "Noida",
                "displayName": "Noida",
                "isActive": True,
                "metroAvailable": True,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
        ]
        
        # Insert cities
        await self.cities_collection.insert_many(default_cities)
        
        # Default localities
        default_localities = [
            # Delhi localities
            {"name": "Connaught Place", "cityId": "delhi", "popular": True, "metroConnected": True},
            {"name": "Saket", "cityId": "delhi", "popular": True, "metroConnected": True},
            {"name": "Nehru Place", "cityId": "delhi", "popular": True, "metroConnected": True},
            {"name": "Okhla", "cityId": "delhi", "popular": True, "metroConnected": False},
            {"name": "Dwarka", "cityId": "delhi", "popular": True, "metroConnected": True},
            {"name": "Karol Bagh", "cityId": "delhi", "popular": True, "metroConnected": True},
            {"name": "Greater Kailash", "cityId": "delhi", "popular": True, "metroConnected": False},
            {"name": "Hauz Khas", "cityId": "delhi", "popular": True, "metroConnected": True},
            {"name": "Janakpuri", "cityId": "delhi", "popular": False, "metroConnected": True},
            {"name": "Vasant Kunj", "cityId": "delhi", "popular": False, "metroConnected": False},
            {"name": "Lajpat Nagar", "cityId": "delhi", "popular": False, "metroConnected": True},
            {"name": "Pitampura", "cityId": "delhi", "popular": False, "metroConnected": True},
            {"name": "Rohini", "cityId": "delhi", "popular": False, "metroConnected": True},
            {"name": "South Extension", "cityId": "delhi", "popular": False, "metroConnected": True},
            {"name": "Green Park", "cityId": "delhi", "popular": False, "metroConnected": True},
            
            # Gurugram localities
            {"name": "Cyber City", "cityId": "gurugram", "popular": True, "metroConnected": True},
            {"name": "Golf Course Road", "cityId": "gurugram", "popular": True, "metroConnected": False},
            {"name": "MG Road", "cityId": "gurugram", "popular": True, "metroConnected": True},
            {"name": "Udyog Vihar", "cityId": "gurugram", "popular": True, "metroConnected": False},
            {"name": "DLF Phase 1", "cityId": "gurugram", "popular": True, "metroConnected": False},
            {"name": "Sohna Road", "cityId": "gurugram", "popular": False, "metroConnected": False},
            {"name": "Sector 32", "cityId": "gurugram", "popular": False, "metroConnected": False},
            {"name": "DLF Phase 2", "cityId": "gurugram", "popular": False, "metroConnected": False},
            {"name": "DLF Phase 3", "cityId": "gurugram", "popular": False, "metroConnected": False},
            
            # Noida localities
            {"name": "Sector 62", "cityId": "noida", "popular": True, "metroConnected": True},
            {"name": "Sector 63", "cityId": "noida", "popular": True, "metroConnected": True},
            {"name": "Sector 18", "cityId": "noida", "popular": True, "metroConnected": True},
            {"name": "Film City", "cityId": "noida", "popular": True, "metroConnected": False},
            {"name": "City Center", "cityId": "noida", "popular": True, "metroConnected": True},
            {"name": "Sector 16", "cityId": "noida", "popular": False, "metroConnected": True},
            {"name": "Sector 135", "cityId": "noida", "popular": False, "metroConnected": True},
            {"name": "Botanical Garden", "cityId": "noida", "popular": False, "metroConnected": True},
            {"name": "Wave City", "cityId": "noida", "popular": False, "metroConnected": False},
        ]
        
        # Insert localities
        localities_to_insert = []
        for locality_data in default_localities:
            locality_id = await self._generate_locality_id(locality_data["name"], locality_data["cityId"])
            locality = {
                "id": locality_id,
                "name": locality_data["name"],
                "displayName": locality_data["name"],
                "cityId": locality_data["cityId"],
                "cityName": locality_data["cityId"].title(),
                "status": LocalityStatus.APPROVED,
                "popular": locality_data["popular"],
                "metroConnected": locality_data["metroConnected"],
                "addedByType": "SYSTEM",
                "listingCount": 0,
                "enquiryCount": 0,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            localities_to_insert.append(locality)
        
        await self.localities_collection.insert_many(localities_to_insert)
    
    async def get_cities(self, active_only: bool = True) -> List[City]:
        """Get all cities."""
        query = {"isActive": True} if active_only else {}
        cities_data = await self.cities_collection.find(query).sort("name", ASCENDING).to_list(length=None)
        
        cities = []
        for city_data in cities_data:
            city_data.pop("_id", None)
            cities.append(City(**city_data))
        
        return cities
    
    async def get_localities_by_city(self, status: Optional[LocalityStatus] = None) -> LocalitiesByCityResponse:
        """Get localities grouped by city."""
        # Build query
        query = {}
        if status:
            query["status"] = status
        
        # Get localities
        localities_data = await self.localities_collection.find(query).sort([
            ("popular", DESCENDING),
            ("listingCount", DESCENDING),
            ("name", ASCENDING)
        ]).to_list(length=None)
        
        # Convert to Locality objects
        localities = []
        for locality_data in localities_data:
            locality_data.pop("_id", None)
            localities.append(Locality(**locality_data))
        
        # Group by city
        by_city = {}
        for locality in localities:
            if locality.cityId not in by_city:
                by_city[locality.cityId] = []
            by_city[locality.cityId].append(locality)
        
        # Get cities
        cities = await self.get_cities()
        
        return LocalitiesByCityResponse(
            by_city=by_city,
            flat=localities,
            cities=cities
        )
    
    async def add_locality(self, request: LocalityRequest) -> Locality:
        """Add a new locality (pending approval)."""
        # Validate addedBy is set (should be set by route handler)
        if not request.addedBy:
            raise ValueError("Partner ID (addedBy) is required")
        
        # Validate city exists
        city = await self.cities_collection.find_one({"id": request.cityId, "isActive": True})
        if not city:
            raise ValueError(f"City {request.cityId} not found or inactive")
        
        # Check if locality already exists in this city
        existing = await self.localities_collection.find_one({
            "name": {"$regex": f"^{re.escape(request.name)}$", "$options": "i"},
            "cityId": request.cityId
        })
        if existing:
            raise ValueError(f"Locality '{request.name}' already exists in {city['name']}")
        
        # Generate locality ID
        locality_id = await self._generate_locality_id(request.name, request.cityId)
        
        # Create locality
        locality_data = {
            "id": locality_id,
            "name": request.name.strip(),
            "displayName": request.name.strip(),
            "cityId": request.cityId,
            "cityName": city["name"],
            "status": LocalityStatus.PENDING,
            "popular": False,
            "metroConnected": request.metroConnected,
            "metroNote": request.metroNote,
            "addedBy": request.addedBy,
            "addedByType": "PARTNER",
            "listingCount": 0,
            "enquiryCount": 0,
            "createdAt": datetime.utcnow(),
            "updatedAt": datetime.utcnow()
        }
        
        # Insert locality
        result = await self.localities_collection.insert_one(locality_data)
        locality_data.pop("_id", None)
        
        return Locality(**locality_data)
    
    async def approve_locality(self, request: LocalityApprovalRequest, admin_id: str) -> Locality:
        """Approve or reject a locality."""
        # Find locality
        locality_data = await self.localities_collection.find_one({"id": request.localityId})
        if not locality_data:
            raise ValueError(f"Locality {request.localityId} not found")
        
        if locality_data["status"] != LocalityStatus.PENDING:
            raise ValueError(f"Locality is not pending approval (current status: {locality_data['status']})")
        
        # Update locality
        update_data = {
            "updatedAt": datetime.utcnow()
        }
        
        if request.action == "APPROVE":
            update_data.update({
                "status": LocalityStatus.APPROVED,
                "approvedBy": admin_id,
                "approvedAt": datetime.utcnow(),
                "popular": request.popular
            })
        else:  # REJECT
            update_data.update({
                "status": LocalityStatus.REJECTED,
                "rejectedBy": admin_id,
                "rejectedAt": datetime.utcnow(),
                "rejectionReason": request.rejectionReason
            })
        
        # Update in database
        await self.localities_collection.update_one(
            {"id": request.localityId},
            {"$set": update_data}
        )
        
        # Return updated locality
        updated_data = await self.localities_collection.find_one({"id": request.localityId})
        updated_data.pop("_id", None)
        
        return Locality(**updated_data)
    
    async def search_localities(
        self,
        query: Optional[str] = None,
        city_id: Optional[str] = None,
        status: Optional[LocalityStatus] = None,
        page: int = 1,
        page_size: int = 50
    ) -> LocalitySearchResponse:
        """Search localities with filters."""
        # Build query
        search_query = {}
        
        if query:
            search_query["name"] = {"$regex": re.escape(query), "$options": "i"}
        
        if city_id:
            search_query["cityId"] = city_id
        
        if status:
            search_query["status"] = status
        
        # Get total count
        total_count = await self.localities_collection.count_documents(search_query)
        
        # Get status counts
        approved_count = await self.localities_collection.count_documents({**search_query, "status": LocalityStatus.APPROVED})
        pending_count = await self.localities_collection.count_documents({**search_query, "status": LocalityStatus.PENDING})
        rejected_count = await self.localities_collection.count_documents({**search_query, "status": LocalityStatus.REJECTED})
        
        # Get paginated results
        skip = (page - 1) * page_size
        localities_data = await self.localities_collection.find(search_query).sort([("popular", DESCENDING), ("listingCount", DESCENDING), ("name", ASCENDING)]).skip(skip).limit(page_size).to_list(length=page_size)
        
        # Convert to Locality objects
        localities = []
        for locality_data in localities_data:
            locality_data.pop("_id", None)
            localities.append(Locality(**locality_data))
        
        return LocalitySearchResponse(
            localities=localities,
            totalCount=total_count,
            approvedCount=approved_count,
            pendingCount=pending_count,
            rejectedCount=rejected_count
        )
    
    async def update_locality_stats(self, locality_name: str, city_name: str, increment_listings: int = 0, increment_enquiries: int = 0):
        """Update locality statistics."""
        if increment_listings == 0 and increment_enquiries == 0:
            return
        
        update_data = {}
        if increment_listings != 0:
            update_data["listingCount"] = increment_listings
        if increment_enquiries != 0:
            update_data["enquiryCount"] = increment_enquiries
        
        # Find by name and city (case insensitive)
        await self.localities_collection.update_one(
            {
                "name": {"$regex": f"^{re.escape(locality_name)}$", "$options": "i"},
                "cityName": {"$regex": f"^{re.escape(city_name)}$", "$options": "i"}
            },
            {"$inc": update_data, "$set": {"updatedAt": datetime.utcnow()}}
        )