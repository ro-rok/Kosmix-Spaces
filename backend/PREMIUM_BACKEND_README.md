# Premium Workspace Platform Backend

A comprehensive FastAPI backend for the premium workspace listing platform with enhanced features including slug-based routing, advanced offering management, photo organization, and robust authentication.

## 🚀 Features

### Core Features
- **Enhanced Authentication**: JWT-based session management with role-based access control
- **Slug-based Routing**: SEO-friendly URLs with collision resolution
- **Premium Listings**: 5 offering types with detailed customization
- **Advanced Photo Management**: Offering-specific photo buckets with Cloudinary integration
- **Location Privacy**: Protected exact addresses with approximate coordinates
- **Comprehensive Analytics**: Event tracking and performance metrics
- **Database Migration**: Seamless migration from legacy to premium format

### API Features
- **RESTful API**: Clean, well-documented endpoints
- **Automatic Validation**: Pydantic models with comprehensive validation
- **Error Handling**: Structured error responses with detailed information
- **CORS Support**: Configurable cross-origin resource sharing
- **Health Checks**: Built-in health monitoring endpoints

## 📋 Requirements

- Python 3.8+
- MongoDB 4.4+
- Cloudinary account (for image storage)

## 🛠 Installation

### 1. Clone and Setup

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=kosmixspaces

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ALG=HS256
JWT_ACCESS_TTL_MIN=60

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Admin
ADMIN_EMAIL=admin@kosmix.com
ADMIN_PASSWORD_HASH=$2b$12$your.bcrypt.hash.here
```

### 3. Run Setup

```bash
python setup_premium.py
```

This will:
- Connect to MongoDB and create indexes
- Migrate legacy listings to premium format (if any)
- Create sample data for development
- Verify configuration

### 4. Start the Server

```bash
python run_dev.py
```

The API will be available at:
- **API**: http://localhost:8000
- **Documentation**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 📚 API Documentation

### Authentication Endpoints

#### Partner Authentication
- `POST /api/partner/auth/register` - Register new partner
- `POST /api/partner/auth/login` - Partner login
- `GET /api/partner/auth/me` - Get current partner info
- `POST /api/partner/auth/logout` - Partner logout

#### Admin Authentication
- `POST /api/admin/auth/login` - Admin login
- `GET /api/admin/auth/me` - Get current admin info

### Premium Listing Endpoints

#### Partner Listing Management
- `POST /api/partner/listings` - Create new listing
- `GET /api/partner/listings` - Get partner's listings
- `GET /api/partner/listings/{id}` - Get specific listing
- `PUT /api/partner/listings/{id}` - Update listing
- `PUT /api/partner/listings/{id}/offerings/{type}` - Update offering
- `POST /api/partner/listings/{id}/offerings/{type}/photos` - Upload photo
- `DELETE /api/partner/listings/{id}/offerings/{type}/photos/{publicId}` - Delete photo
- `POST /api/partner/listings/{id}/validate` - Validate for submission
- `POST /api/partner/listings/{id}/submit` - Submit for review

#### Public Listing Access
- `GET /api/public/listings` - Search listings with filters
- `GET /api/public/listings/{slug}` - Get listing by slug
- `GET /api/public/localities` - Get available localities
- `GET /api/public/search/suggestions` - Get search suggestions
- `GET /api/public/featured` - Get featured listings

### Enhanced Features

#### Advanced Filtering
The public listings endpoint supports comprehensive filtering:

```http
GET /api/public/listings?locality=connaught-place,saket&budgetBand=₹,₹₹&teamSize=5-10&meetingRooms=true&verifiedOnly=true&amenities=wifi,parking&sort=recommended&page=1&pageSize=20
```

#### Slug-based Routing
Listings are accessible via SEO-friendly URLs:
```
/api/public/listings/wework-india/connaught-place/premium-office-space
```

With automatic collision resolution:
```
/api/public/listings/wework-india/connaught-place/premium-office-space-abc123
```

#### Offering Management
Each listing supports 5 offering types:
- **Private Offices**: Dedicated office spaces
- **Dedicated Desks**: Personal desks in shared spaces
- **Hot Desks**: Flexible seating arrangements
- **Meeting Rooms**: Conference and meeting facilities
- **Event Spaces**: Large spaces for events and workshops

#### Photo Organization
Photos are organized by offering type with features:
- Upload to specific offering buckets
- Drag-and-drop reordering
- Automatic thumbnail generation
- Cloudinary integration for optimization

## 🗄 Database Schema

### Premium Listings Collection

```javascript
{
  "_id": ObjectId,
  "partnerId": ObjectId,
  "displayName": "Premium Office Space",
  "overview": "Detailed description...",
  "slugData": {
    "slug": "/listing/partner/locality/name",
    "partnerSlug": "partner",
    "localitySlug": "locality", 
    "nameSlug": "name",
    "hashSuffix": "abc123" // Optional collision resolution
  },
  "location": {
    "locality": "Connaught Place",
    "city": "Delhi",
    "exactAddress": null, // Internal only, never exposed
    "nearMetro": true,
    "metroNote": "2 min walk to Rajiv Chowk",
    "approximateCoordinates": {"lat": 28.63, "lng": 77.22}
  },
  "offerings": {
    "private-offices": {
      "type": "private-offices",
      "title": "Private Offices",
      "description": "...",
      "features": ["Furnished", "AC", "WiFi"],
      "enabled": true,
      "startingPrice": 25000,
      "unit": "month",
      "budgetBand": "₹₹",
      "photos": [...],
      "capacity": {"minSeats": 2, "maxSeats": 10}
    },
    // ... other offering types
  },
  "amenities": ["WiFi", "Parking", "Cafeteria"],
  "verificationStatus": "APPROVED_VERIFIED",
  "isPublished": true,
  "viewCount": 150,
  "enquiryCount": 12,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

## 🔧 Development

### Running Tests

```bash
# Run all tests
python -m pytest

# Run specific test file
python -m pytest tests/test_premium_listings.py

# Run with coverage
python -m pytest --cov=app
```

### Database Migration

To migrate legacy listings to premium format:

```bash
python -m app.db.migrate_to_premium
```

To rollback migration:

```bash
python -c "
import asyncio
from app.db.migrate_to_premium import rollback_migration
from app.db.mongodb import connect_to_mongo, close_mongo_connection

async def main():
    await connect_to_mongo()
    result = await rollback_migration()
    print(result)
    await close_mongo_connection()

asyncio.run(main())
"
```

### Creating Database Indexes

```bash
python -c "
import asyncio
from app.db.indexes import create_indexes
from app.db.mongodb import connect_to_mongo, close_mongo_connection

async def main():
    await connect_to_mongo()
    await create_indexes()
    await close_mongo_connection()

asyncio.run(main())
"
```

## 🚀 Deployment

### Environment Variables

Ensure all required environment variables are set:

```bash
# Required
JWT_SECRET=your-production-secret
MONGODB_URI=mongodb://your-production-db
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret
ADMIN_EMAIL=admin@yourcompany.com
ADMIN_PASSWORD_HASH=your-bcrypt-hash

# Optional
API_HOST=0.0.0.0
API_PORT=8000
CORS_ORIGINS=https://yourfrontend.com
```

### Docker Deployment

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["python", "run_dev.py"]
```

### Production Considerations

1. **Security**:
   - Use strong JWT secrets
   - Enable HTTPS
   - Configure proper CORS origins
   - Use environment-specific admin credentials

2. **Performance**:
   - Enable MongoDB connection pooling
   - Configure Cloudinary optimization settings
   - Use Redis for caching (optional)
   - Enable gzip compression

3. **Monitoring**:
   - Set up health check endpoints
   - Monitor database performance
   - Track API response times
   - Log errors and analytics events

## 📊 Analytics

The platform includes comprehensive analytics tracking:

### Event Types
- `listing_view` - When a listing is viewed
- `enquiry_submit` - When an enquiry is submitted
- `whatsapp_click` - When WhatsApp link is clicked
- `call_click` - When call button is clicked
- `search_performed` - When search is performed
- `filter_applied` - When filters are applied
- `partner_signup` - When partner registers
- `partner_listing_submitted` - When listing is submitted

### Analytics Endpoints
- `POST /api/analytics/events` - Track events in batch
- `GET /api/analytics/admin` - Admin dashboard analytics
- `GET /api/analytics/partner/{id}` - Partner-specific analytics
- `GET /api/analytics/listing/{id}` - Listing performance metrics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the API documentation at `/docs`
- Review the database schema
- Check environment configuration
- Verify Cloudinary setup
- Ensure MongoDB is running and accessible

## 🔄 Migration Guide

### From Legacy to Premium

The migration process automatically:
1. Converts workspace types to offering types
2. Generates SEO-friendly slugs
3. Protects location privacy
4. Maps verification statuses
5. Preserves all existing data

### Manual Migration Steps

If automatic migration fails:

1. **Backup your data**:
   ```bash
   mongodump --db kosmixspaces --out backup/
   ```

2. **Run migration script**:
   ```bash
   python -m app.db.migrate_to_premium
   ```

3. **Verify migration**:
   ```bash
   # Check counts
   mongo kosmixspaces --eval "db.listings.count()"
   mongo kosmixspaces --eval "db.premium_listings.count()"
   ```

4. **Test API endpoints**:
   ```bash
   curl http://localhost:8000/api/public/listings
   ```

The premium backend is now ready to power your workspace marketplace with enhanced features and robust architecture! 🎉