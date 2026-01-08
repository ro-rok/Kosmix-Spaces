# Kosmix Spaces Backend API

Production-grade FastAPI backend for the Kosmix Spaces workspace marketplace.

## Tech Stack

- **FastAPI** (async)
- **MongoDB** with Motor (async driver)
- **Pydantic v2** for data validation
- **Cloudinary** for image storage
- **JWT** authentication (partner + admin)
- **Pillow** for server-side image compression

## Features

- ✅ Public listings API (no address exposure)
- ✅ Partner authentication and listing management
- ✅ Admin verification workflow
- ✅ Lead and visit request management
- ✅ Server-side image compression before Cloudinary upload
- ✅ CORS enabled for frontend

## Setup

### Prerequisites

- Python 3.11+
- MongoDB 7.0+ (or use Docker Compose)
- Cloudinary account

### Local Development

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   Create a `.env` file in the `backend` directory:
   ```env
   APP_ENV=dev
   API_HOST=0.0.0.0
   API_PORT=8000
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DB=kosmixspaces
   JWT_SECRET=your-secret-key-change-in-production
   JWT_ALG=HS256
   JWT_ACCESS_TTL_MIN=60
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   CLOUDINARY_FOLDER=kosmixspaces
   CORS_ORIGINS=http://localhost:3000,http://localhost:5173
   ADMIN_EMAIL=admin@kosmix.com
   ADMIN_PASSWORD_HASH=your-bcrypt-hash
   ```

   **Generate admin password hash:**
   ```python
   from passlib.context import CryptContext
   pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
   print(pwd_context.hash("your-admin-password"))
   ```

5. **Start MongoDB:**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d mongodb
   
   # Or start MongoDB locally
   mongod
   ```

6. **Run the backend:**
   ```bash
   uvicorn app.main:app --reload
   ```

   The API will be available at `http://localhost:8000`
   API docs at `http://localhost:8000/docs`

### Docker Compose (Full Stack)

1. **Set environment variables in `.env` file** (see above)

2. **Start services:**
   ```bash
   docker-compose up -d
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f backend
   ```

4. **Stop services:**
   ```bash
   docker-compose down
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `APP_ENV` | Environment (dev/prod) | `dev` |
| `API_HOST` | API host | `0.0.0.0` |
| `API_PORT` | API port | `8000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `MONGODB_DB` | Database name | `kosmixspaces` |
| `JWT_SECRET` | JWT secret key | **Required** |
| `JWT_ALG` | JWT algorithm | `HS256` |
| `JWT_ACCESS_TTL_MIN` | Token TTL in minutes | `60` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | **Required** |
| `CLOUDINARY_API_KEY` | Cloudinary API key | **Required** |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | **Required** |
| `CLOUDINARY_FOLDER` | Cloudinary folder | `kosmixspaces` |
| `CORS_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` |
| `ADMIN_EMAIL` | Admin email | `admin@kosmix.com` |
| `ADMIN_PASSWORD_HASH` | Admin password (bcrypt hash) | **Required** |

## Image Compression

**All images are compressed server-side BEFORE uploading to Cloudinary.**

The compression process:
1. Validates content-type (JPEG, PNG, WebP)
2. Enforces max upload size (10MB)
3. Converts to RGB (handles PNG alpha on white background)
4. Resizes to max width 1600px (maintains aspect ratio)
5. Strips EXIF metadata
6. Saves as WEBP (quality=75) or JPEG fallback
7. Uploads compressed bytes to Cloudinary

This ensures:
- Faster uploads
- Reduced storage costs
- Consistent image sizes
- No EXIF data leakage

## Testing Image Upload

Test the photo upload endpoint with curl:

```bash
curl -X POST "http://localhost:8000/api/partner/listings/{listing_id}/photos" \
  -H "Authorization: Bearer YOUR_PARTNER_TOKEN" \
  -F "file=@/path/to/image.jpg"
```

## Reset MongoDB

**⚠️ Warning: This will delete all data!**

```bash
# Using Docker Compose
docker-compose down -v
docker-compose up -d mongodb

# Or manually
mongo kosmixspaces --eval "db.dropDatabase()"
```

## API Endpoints

### Public

- `GET /api/public/localities` - List localities
- `GET /api/public/listings` - Search/filter listings
- `GET /api/public/listings/{slug}` - Get listing detail
- `POST /api/public/leads` - Submit enquiry lead
- `POST /api/public/site-visits` - Request site visit

### Partner Auth

- `POST /api/partner/auth/register` - Register partner
- `POST /api/partner/auth/login` - Partner login
- `POST /api/partner/auth/logout` - Partner logout
- `GET /api/partner/me` - Get current partner

### Partner Listings

- `GET /api/partner/listings` - List own listings
- `POST /api/partner/listings` - Create listing
- `GET /api/partner/listings/{id}` - Get listing
- `PUT /api/partner/listings/{id}` - Update listing
- `POST /api/partner/listings/{id}/photos` - Upload photo
- `DELETE /api/partner/listings/{id}/photos/{publicId}` - Delete photo

### Admin Auth

- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/me` - Get current admin

### Admin Listings

- `GET /api/admin/listings` - List all listings
- `GET /api/admin/listings/{id}` - Get listing (admin view)
- `PATCH /api/admin/listings/{id}/verification` - Update verification
- `POST /api/admin/listings/{id}/approve` - Approve listing
- `POST /api/admin/listings/{id}/needs-info` - Mark needs info
- `POST /api/admin/listings/{id}/reject` - Reject listing

### Admin Leads & Visits

- `GET /api/admin/leads` - List leads
- `PATCH /api/admin/leads/{id}` - Update lead
- `GET /api/admin/site-visits` - List visits
- `PATCH /api/admin/site-visits/{id}` - Update visit

## Frontend Integration

### Environment Variables (Frontend)

Add to your frontend `.env`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

### TypeScript API Client Examples

```typescript
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

// Fetch listings
async function fetchListings(filters?: {
  locality?: string;
  budgetBandId?: string;
  teamSizeBand?: string;
  spaceType?: string;
  nearMetro?: boolean;
  parking?: string;
  powerBackup?: boolean;
  gstInvoice?: boolean;
  sort?: 'best_match' | 'budget_low' | 'recent_verified';
  page?: number;
  pageSize?: number;
}) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
  }
  
  const response = await fetch(`${API_BASE_URL}/api/public/listings?${params}`);
  return response.json();
}

// Fetch listing by slug
async function fetchListing(slug: string) {
  const response = await fetch(`${API_BASE_URL}/api/public/listings/${slug}`);
  return response.json();
}

// Submit lead
async function submitLead(lead: {
  name: string;
  phone: string;
  email?: string;
  company?: string;
  teamSizeBand?: string;
  preferredLocalities?: string[];
  budgetBandId?: string;
  spaceType?: string;
  moveInTimeframe?: string;
  meetingRoomsAddon?: boolean;
  gstInvoiceRequired?: boolean;
  parkingNeeded?: boolean;
  powerBackupRequired?: boolean;
  nearMetroPreferred?: boolean;
  notes?: string;
  source?: string;
  listingSlug?: string;
}) {
  const response = await fetch(`${API_BASE_URL}/api/public/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(lead),
  });
  return response.json();
}

// Partner login
async function partnerLogin(email: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/api/partner/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json();
  // Store token: localStorage.setItem('partner_token', data.accessToken);
  return data;
}

// Create listing
async function partnerCreateListing(listing: {
  displayName: string;
  brandHidden?: boolean;
  locality: string;
  workspaceTypes: string[];
  seatCapacityMin: number;
  seatCapacityMax: number;
  availabilityStatus: string;
  budgetBandId: string;
  budgetDisplayText: string;
  nearMetro?: boolean;
  metroNote?: string;
  parking?: string;
  powerBackup?: boolean;
  gstInvoiceAvailable?: boolean;
  accessHours: string;
  weekendAccess?: boolean;
  amenities?: string[];
  meetingRoomsCount?: number;
  meetingRoomsAddonOnly?: boolean;
  internetSpeedMbps?: number;
  dealTags?: string[];
  dealDetails?: string;
  dealEligibility?: string;
  overview: string;
  houseRules?: string;
}, token: string) {
  const response = await fetch(`${API_BASE_URL}/api/partner/listings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(listing),
  });
  return response.json();
}

// Upload photo
async function partnerUploadPhoto(
  listingId: string,
  file: File,
  token: string
) {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(
    `${API_BASE_URL}/api/partner/listings/${listingId}/photos`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    }
  );
  return response.json();
}

// Admin approve listing
async function adminApproveListing(
  listingId: string,
  notes?: string,
  token: string
) {
  const response = await fetch(
    `${API_BASE_URL}/api/admin/listings/${listingId}/approve`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ notes }),
    }
  );
  return response.json();
}
```

## Security Notes

- **JWT tokens** expire after 60 minutes (configurable)
- **Passwords** are hashed with bcrypt
- **Public APIs** never expose exact addresses
- **Image uploads** are validated and compressed server-side
- **CORS** is configured for specific origins
- **Rate limiting** not implemented for MVP (TODO: add rate limiting)

## Database Collections

- `partners` - Partner accounts
- `listings` - Workspace listings
- `leads` - Enquiry leads
- `site_visits` - Site visit requests
- `verifications` - Admin verification records

## Development

### Run with auto-reload:
```bash
uvicorn app.main:app --reload
```

### Run tests (when implemented):
```bash
pytest
```

## Production Deployment

1. Set `APP_ENV=prod`
2. Use strong `JWT_SECRET`
3. Configure production `CORS_ORIGINS`
4. Use MongoDB Atlas or managed MongoDB
5. Set up Cloudinary production account
6. Use environment variable management (e.g., AWS Secrets Manager)
7. Enable HTTPS
8. Set up monitoring and logging

## License

See LICENSE file in project root.
