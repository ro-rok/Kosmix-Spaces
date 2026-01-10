# Kosmix Spaces Backend API Documentation

## Base URL
- **Development**: `http://localhost:8000`
- **API Prefix**: `/api`

## Authentication
- **JWT Token**: Required for protected endpoints
- **Header**: `Authorization: Bearer <token>`
- **Roles**: `PARTNER`, `ADMIN`

---

## Health Check

### GET `/api/health`
**Description**: Health check endpoint  
**Authentication**: None  
**Response**:
```json
{
  "status": "ok"
}
```

---

## Public Endpoints

### GET `/api/public/localities`
**Description**: Get list of available localities  
**Authentication**: None  
**Response**:
```json
[
  {
    "id": "connaught-place",
    "name": "Connaught Place", 
    "city": "Delhi",
    "popular": true
  }
]
```

### GET `/api/public/listings`
**Description**: Get public listings with filters  
**Authentication**: None  
**Query Parameters**:
- `locality` (optional): Filter by locality
- `budgetBandId` (optional): Filter by budget band
- `teamSizeBand` (optional): Filter by team size
- `spaceType` (optional): Filter by space type
- `nearMetro` (optional): Filter by metro proximity
- `parking` (optional): Filter by parking availability
- `powerBackup` (optional): Filter by power backup
- `gstInvoice` (optional): Filter by GST invoice availability
- `sort` (optional): Sort order (`best_match`, `budget_low`, `recent_verified`)
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)

**Response**:
```json
{
  "items": [...],
  "total": 150,
  "page": 1,
  "pageSize": 20
}
```

### GET `/api/public/listings/{slug}`
**Description**: Get public listing detail by slug  
**Authentication**: None  
**Response**: Detailed listing object

### POST `/api/public/leads`
**Description**: Create an enquiry lead  
**Authentication**: None  
**Request Body**:
```json
{
  "name": "John Doe",
  "phone": "+91-9876543210",
  "email": "john@example.com",
  "preferredLocalities": ["connaught-place"],
  "budgetBandId": "budget-10k-25k",
  "teamSizeBand": "5-10",
  "spaceType": "PRIVATE_OFFICE"
}
```
**Response**:
```json
{
  "leadId": "...",
  "message": "Thank you! We'll get back to you within 3 hours.",
  "whatsappDeepLink": "https://wa.me/..."
}
```

### POST `/api/public/site-visits`
**Description**: Create a site visit request  
**Authentication**: None  
**Request Body**:
```json
{
  "name": "John Doe",
  "phone": "+91-9876543210",
  "email": "john@example.com",
  "listingIds": ["listing_id_1", "listing_id_2"],
  "preferredSlots": [
    {
      "date": "2024-01-15",
      "timeSlot": "10:00-11:00"
    }
  ],
  "visitorCount": 2
}
```
**Response**:
```json
{
  "visitRequestId": "...",
  "message": "Visit request received! We'll confirm within 3 hours."
}
```

---

## Partner Authentication

### POST `/api/partner/auth/register`
**Description**: Register a new partner account  
**Authentication**: None  
**Request Body**:
```json
{
  "workspaceBrandName": "My Workspace",
  "contactName": "John Doe",
  "phone": "+91-9876543210",
  "email": "partner@example.com",
  "password": "securepassword"
}
```
**Response**:
```json
{
  "partnerId": "...",
  "workspaceBrandName": "My Workspace",
  "contactName": "John Doe",
  "phone": "+91-9876543210",
  "email": "partner@example.com",
  "status": "PENDING"
}
```

### POST `/api/partner/auth/login`
**Description**: Partner login  
**Authentication**: None  
**Request Body**:
```json
{
  "email": "partner@example.com",
  "password": "securepassword"
}
```
**Response**:
```json
{
  "accessToken": "jwt_token_here"
}
```

### POST `/api/partner/auth/logout`
**Description**: Partner logout (frontend-only)  
**Authentication**: Required (Partner)  
**Response**:
```json
{
  "ok": true
}
```

### GET `/api/partner/auth/me`
**Description**: Get current partner info  
**Authentication**: Required (Partner)  
**Response**:
```json
{
  "partnerId": "...",
  "workspaceBrandName": "My Workspace",
  "contactName": "John Doe",
  "phone": "+91-9876543210",
  "email": "partner@example.com",
  "status": "ACTIVE"
}
```

---

## Partner Listings

### GET `/api/partner/listings`
**Description**: Get all listings for current partner  
**Authentication**: Required (Partner)  
**Response**: Array of partner listing objects

### POST `/api/partner/listings`
**Description**: Create a new listing  
**Authentication**: Required (Partner)  
**Request Body**:
```json
{
  "displayName": "Premium Office Space",
  "brandHidden": false,
  "locality": "connaught-place",
  "workspaceTypes": ["PRIVATE_OFFICE"],
  "seatCapacityMin": 10,
  "seatCapacityMax": 50,
  "availabilityStatus": "AVAILABLE",
  "budgetBandId": "budget-25k-50k",
  "budgetDisplayText": "₹25,000 - ₹50,000",
  "nearMetro": true,
  "metroNote": "5 min walk to Rajiv Chowk",
  "parking": "AVAILABLE",
  "powerBackup": true,
  "gstInvoiceAvailable": true,
  "accessHours": "24x7",
  "weekendAccess": true,
  "amenities": ["wifi", "ac", "cafeteria"],
  "meetingRoomsCount": 2,
  "meetingRoomsAddonOnly": false,
  "internetSpeedMbps": 100,
  "dealTags": ["NEW_LAUNCH"],
  "dealDetails": "20% off first month",
  "dealEligibility": "New customers only",
  "overview": "Premium office space in the heart of Delhi",
  "houseRules": "No smoking, pets allowed"
}
```
**Response**: Created listing object

### GET `/api/partner/listings/{listing_id}`
**Description**: Get a listing by ID (only own listings)  
**Authentication**: Required (Partner)  
**Response**: Detailed listing object

### PUT `/api/partner/listings/{listing_id}`
**Description**: Update a listing  
**Authentication**: Required (Partner)  
**Request Body**: Partial listing update object  
**Response**: Updated listing object

### POST `/api/partner/listings/{listing_id}/photos`
**Description**: Upload a photo for a listing  
**Authentication**: Required (Partner)  
**Request**: Multipart form data with image file  
**Response**: Array of photo objects

### DELETE `/api/partner/listings/{listing_id}/photos/{public_id}`
**Description**: Delete a photo from a listing  
**Authentication**: Required (Partner)  
**Response**:
```json
{
  "ok": true
}
```

---

## Admin Authentication

### POST `/api/admin/auth/login`
**Description**: Admin login  
**Authentication**: None  
**Request Body**:
```json
{
  "email": "admin@example.com",
  "password": "adminpassword"
}
```
**Response**:
```json
{
  "accessToken": "jwt_token_here"
}
```

### GET `/api/admin/auth/me`
**Description**: Get current admin info  
**Authentication**: Required (Admin)  
**Response**:
```json
{
  "adminId": "admin",
  "email": "admin@example.com",
  "role": "ADMIN"
}
```

---

## Admin Listings

### GET `/api/admin/listings`
**Description**: Get listings with filters (admin view)  
**Authentication**: Required (Admin)  
**Query Parameters**:
- `status` (optional): Filter by verification status
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 50, max: 100)

**Response**: Array of admin listing objects with verification checks

### GET `/api/admin/listings/{listing_id}`
**Description**: Get a listing by ID (admin view)  
**Authentication**: Required (Admin)  
**Response**: Detailed listing object with verification data

### PATCH `/api/admin/listings/{listing_id}/verification`
**Description**: Update verification checks and notes  
**Authentication**: Required (Admin)  
**Request Body**:
```json
{
  "checks": {
    "photosQuality": true,
    "contactVerified": false,
    "locationAccurate": true
  },
  "notes": "Photos need better lighting"
}
```
**Response**:
```json
{
  "ok": true
}
```

### POST `/api/admin/listings/{listing_id}/approve`
**Description**: Approve a listing  
**Authentication**: Required (Admin)  
**Request Body**:
```json
{
  "notes": "Approved after verification"
}
```
**Response**:
```json
{
  "ok": true,
  "message": "Listing approved and published"
}
```

### POST `/api/admin/listings/{listing_id}/needs-info`
**Description**: Set listing to NEEDS_INFO status  
**Authentication**: Required (Admin)  
**Request Body**:
```json
{
  "notes": "Please provide better photos"
}
```
**Response**:
```json
{
  "ok": true,
  "message": "Listing marked as needs info"
}
```

### POST `/api/admin/listings/{listing_id}/reject`
**Description**: Reject a listing  
**Authentication**: Required (Admin)  
**Request Body**:
```json
{
  "reason": "Duplicate listing"
}
```
**Response**:
```json
{
  "ok": true,
  "message": "Listing rejected"
}
```

---

## Admin Partners

### GET `/api/admin/partners`
**Description**: Get all partners with filtering and pagination  
**Authentication**: Required (Admin)  
**Query Parameters**:
- `status` (optional): Filter by partner status
- `search` (optional): Search by name or email
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 20, max: 100)

**Response**:
```json
{
  "items": [...],
  "total": 50,
  "page": 1,
  "pageSize": 20
}
```

### GET `/api/admin/partners/{partner_id}`
**Description**: Get partner by ID  
**Authentication**: Required (Admin)  
**Response**: Partner object

### PATCH `/api/admin/partners/{partner_id}/status`
**Description**: Update partner status  
**Authentication**: Required (Admin)  
**Request Body**:
```json
{
  "status": "ACTIVE",
  "notes": "Approved after verification"
}
```
**Response**: Updated partner object

### DELETE `/api/admin/partners/{partner_id}`
**Description**: Delete partner account  
**Authentication**: Required (Admin)  
**Response**:
```json
{
  "message": "Partner deleted successfully"
}
```

---

## Admin Leads

### GET `/api/admin/leads`
**Description**: Get leads with filters  
**Authentication**: Required (Admin)  
**Query Parameters**:
- `status` (optional): Filter by lead status
- `locality` (optional): Filter by locality
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 50, max: 100)

**Response**: Array of lead objects

### PATCH `/api/admin/leads/{lead_id}`
**Description**: Update lead status, assignment, priority  
**Authentication**: Required (Admin)  
**Request Body**:
```json
{
  "status": "IN_PROGRESS",
  "assignedTo": "sales_rep_1",
  "priority": "HIGH"
}
```
**Response**: Updated lead object

---

## Admin Site Visits

### GET `/api/admin/site-visits`
**Description**: Get site visits with filters  
**Authentication**: Required (Admin)  
**Query Parameters**:
- `status` (optional): Filter by visit status
- `leadId` (optional): Filter by lead ID
- `page` (optional): Page number (default: 1)
- `pageSize` (optional): Items per page (default: 50, max: 100)

**Response**: Array of site visit objects

### PATCH `/api/admin/site-visits/{visit_id}`
**Description**: Update visit status and confirmed slot  
**Authentication**: Required (Admin)  
**Request Body**:
```json
{
  "status": "CONFIRMED",
  "confirmedSlot": {
    "date": "2024-01-15",
    "timeSlot": "10:00-11:00"
  },
  "opsOwner": "ops_team_member",
  "partnerNotes": "Partner confirmed availability",
  "customerNotes": "Customer prefers morning slot"
}
```
**Response**: Updated site visit object

---

---

## Analytics Endpoints

### POST `/api/analytics/events`
**Description**: Track analytics events in batch  
**Authentication**: None (for anonymous user tracking)  
**Request Body**:
```json
{
  "events": [
    {
      "eventId": "evt_1234567890_abc123",
      "eventName": "listing_view",
      "timestamp": "2024-01-15T10:30:00Z",
      "sessionId": "sess_1234567890_xyz789",
      "userRole": "anon",
      "listingId": "listing_123",
      "path": "/spaces/premium-office-cp",
      "metadata": {
        "locality": "Connaught Place"
      }
    }
  ]
}
```
**Response**:
```json
{
  "success": true,
  "eventsTracked": 1,
  "message": "Successfully tracked 1 events"
}
```

### GET `/api/analytics/admin`
**Description**: Get comprehensive analytics for admin dashboard  
**Authentication**: Required (Admin)  
**Query Parameters**:
- `start_date` (optional): Start date in ISO format
- `end_date` (optional): End date in ISO format

**Response**:
```json
{
  "totalViews": 1250,
  "totalEnquiries": 89,
  "totalSearches": 2340,
  "partnerSignups": 23,
  "conversionRate": 7.1,
  "topListings": [...],
  "topLocalities": [...]
}
```

### GET `/api/analytics/partner/{partner_id}`
**Description**: Get analytics for a specific partner  
**Authentication**: Required (Partner/Admin)  
**Query Parameters**: Same as admin endpoint  
**Response**:
```json
{
  "views": 456,
  "enquiries": 23,
  "conversionRate": 5.0,
  "topListings": [...]
}
```

### GET `/api/analytics/listing/{listing_id}`
**Description**: Get performance metrics for a specific listing  
**Authentication**: Required (Owner/Admin)  
**Response**:
```json
{
  "listingId": "listing_123",
  "views": 234,
  "enquiries": 15,
  "conversionRate": 6.4,
  "lastActivity": "2024-01-15T10:30:00Z"
}
```

### GET `/api/analytics/health`
**Description**: Health check for analytics service  
**Authentication**: None  
**Response**:
```json
{
  "status": "healthy",
  "service": "analytics",
  "totalEvents": 12450,
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Root Endpoint

### GET `/`
**Description**: Root endpoint with API information  
**Authentication**: None  
**Response**:
```json
{
  "message": "Kosmix Spaces API",
  "version": "1.0.0",
  "docs": "/docs"
}
```

---

## Error Responses

All endpoints return standardized error responses:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message",
    "details": {}
  }
}
```

**Common Error Codes**:
- `VALIDATION_ERROR` (422): Request validation failed
- `UNAUTHORIZED` (401): Authentication required or invalid
- `FORBIDDEN` (403): Access denied
- `NOT_FOUND` (404): Resource not found
- `CONFLICT` (409): Resource already exists
- `INTERNAL_ERROR` (500): Server error

---

## Status Enums

**Partner Status**:
- `PENDING`: Awaiting admin approval
- `ACTIVE`: Approved and active
- `SUSPENDED`: Account suspended

**Listing Verification Status**:
- `PENDING_REVIEW`: Awaiting admin review
- `NEEDS_INFO`: Requires additional information
- `APPROVED_VERIFIED`: Approved and published
- `REJECTED`: Rejected by admin

**Lead Status**:
- `NEW`: New lead
- `IN_PROGRESS`: Being processed
- `CONVERTED`: Successfully converted
- `CLOSED`: Closed without conversion
- `VISIT_REQUESTED`: Site visit requested

**Visit Status**:
- `REQUESTED`: Visit requested
- `CONFIRMED`: Visit confirmed
- `COMPLETED`: Visit completed
- `CANCELLED`: Visit cancelled