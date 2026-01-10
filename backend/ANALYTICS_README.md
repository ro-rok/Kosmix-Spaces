# Analytics System Documentation

## Overview

The analytics system provides comprehensive event tracking and reporting for the Kosmix Spaces platform. It tracks user interactions, generates insights, and provides dashboards for both administrators and partners.

## Architecture

### Components

1. **Models** (`app/models/analytics.py`)
   - `AnalyticsEvent`: Core event model with privacy-compliant structure
   - `AnalyticsSummary`: Admin dashboard aggregated data
   - `PartnerAnalytics`: Partner-specific performance metrics
   - Supporting models for filters and performance tracking

2. **Service** (`app/services/analytics_service.py`)
   - `AnalyticsService`: Core business logic for event processing
   - Event enrichment with listing/partner context
   - Aggregation queries for dashboard data
   - Performance metrics calculation

3. **Router** (`app/routers/analytics.py`)
   - REST API endpoints for event tracking and reporting
   - Authentication and authorization handling
   - Error handling and validation

4. **Database** (MongoDB)
   - `analytics_events` collection with optimized indexes
   - Efficient querying for time-based analytics
   - Aggregation pipelines for real-time insights

## Event Types

The system tracks the following events:

- `listing_view`: User views a listing detail page
- `enquiry_submit`: User submits an enquiry form
- `whatsapp_click`: User clicks WhatsApp contact button
- `call_click`: User clicks call contact button
- `search_performed`: User performs a search query
- `filter_applied`: User applies search filters
- `partner_signup`: New partner registration
- `partner_listing_submitted`: Partner submits listing for approval

## API Endpoints

### Event Tracking

#### POST `/api/analytics/events`
Track multiple events in batch (no authentication required).

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
        "locality": "Connaught Place",
        "verificationStatus": "verified"
      }
    }
  ]
}
```

#### POST `/api/analytics/events/single`
Track a single event (alternative endpoint).

### Analytics Reporting

#### GET `/api/analytics/admin`
Get comprehensive analytics for admin dashboard (admin authentication required).

Query Parameters:
- `start_date`: ISO datetime string (optional, defaults to 30 days ago)
- `end_date`: ISO datetime string (optional, defaults to now)

Response:
```json
{
  "totalViews": 1250,
  "totalEnquiries": 89,
  "totalSearches": 2340,
  "partnerSignups": 23,
  "conversionRate": 7.1,
  "topListings": [
    {
      "listingId": "listing_123",
      "displayName": "Premium Office Space, CP",
      "views": 234,
      "enquiries": 18
    }
  ],
  "topLocalities": [
    {
      "locality": "Connaught Place",
      "searches": 456,
      "views": 789
    }
  ]
}
```

#### GET `/api/analytics/partner/{partner_id}`
Get analytics for a specific partner (partner/admin authentication required).

Query Parameters: Same as admin endpoint

Response:
```json
{
  "views": 456,
  "enquiries": 23,
  "conversionRate": 5.0,
  "topListings": [
    {
      "listingId": "listing_123",
      "displayName": "Premium Office Space",
      "views": 234,
      "enquiries": 15
    }
  ]
}
```

#### GET `/api/analytics/listing/{listing_id}`
Get performance metrics for a specific listing (owner/admin authentication required).

## Database Schema

### Analytics Events Collection

```javascript
{
  "_id": ObjectId,
  "eventId": "evt_1234567890_abc123",
  "eventName": "listing_view",
  "timestamp": ISODate("2024-01-15T10:30:00Z"),
  "sessionId": "sess_1234567890_xyz789",
  "userRole": "anon",
  "listingId": "listing_123",
  "listingSlug": "premium-office-cp",
  "partnerId": "partner_456",
  "referrer": "https://google.com",
  "path": "/spaces/premium-office-cp",
  "metadata": {
    "locality": "Connaught Place",
    "verificationStatus": "verified"
  },
  "locality": "Connaught Place",
  "city": "Delhi",
  "createdAt": ISODate("2024-01-15T10:30:00Z"),
  "updatedAt": ISODate("2024-01-15T10:30:00Z")
}
```

### Indexes

The following indexes are created for optimal query performance:

- `eventId` (unique)
- `timestamp`
- `eventName`
- `sessionId`
- `userRole`
- `listingId`
- `partnerId`
- `locality`
- Compound indexes for common query patterns

## Privacy and Compliance

### No PII Collection
The analytics system is designed to be privacy-compliant:
- No personally identifiable information (PII) is stored
- Email addresses, phone numbers, and names are excluded
- Session IDs are anonymous and temporary
- IP addresses are not logged

### Data Retention
- Events are stored indefinitely for business intelligence
- Session IDs expire and are not linked to user accounts
- Aggregated data is used for reporting

## Frontend Integration

### Analytics Client (`frontend/src/lib/analytics.ts`)

The frontend analytics client provides:
- Automatic event batching (10 events or 5-second intervals)
- Session management with temporary IDs
- Context enrichment (listing IDs, user roles)
- Graceful error handling with retry logic

### Usage Examples

```typescript
import { 
  trackListingView, 
  trackEnquirySubmit, 
  trackSearchPerformed 
} from '@/lib/analytics';

// Track listing view
trackListingView('listing_123', 'premium-office-cp', {
  locality: 'Connaught Place',
  verificationStatus: 'verified'
});

// Track enquiry submission
trackEnquirySubmit('listing_123', 'form', {
  locality: 'Connaught Place'
});

// Track search
trackSearchPerformed('coworking space', ['locality:cp'], {
  sortBy: 'recommended'
});
```

## Performance Considerations

### Batch Processing
- Events are batched to reduce API calls
- Maximum batch size: 100 events
- Automatic flush every 5 seconds
- Immediate flush on page unload

### Database Optimization
- Compound indexes for common query patterns
- Aggregation pipelines for efficient reporting
- Time-based partitioning considerations for large datasets

### Caching Strategy
- Dashboard data cached for 5 minutes
- Partner analytics cached for 2 minutes
- Real-time events not cached

## Monitoring and Alerting

### Health Checks
- `/api/analytics/health` endpoint for service monitoring
- Database connection validation
- Event count reporting

### Error Handling
- Graceful degradation when backend is unavailable
- Client-side retry logic with exponential backoff
- Comprehensive error logging

## Development and Testing

### Local Development
1. Start MongoDB: `mongod`
2. Start backend: `python -m uvicorn app.main:app --reload`
3. Visit API docs: `http://localhost:8000/docs`

### Testing
- Unit tests for service logic
- Integration tests for API endpoints
- Frontend analytics client tests
- Performance tests for aggregation queries

### Mock Data
The system includes fallback mock data for development:
- Frontend gracefully handles backend unavailability
- Realistic sample data for UI development
- Consistent data structure for testing

## Deployment Considerations

### Environment Variables
- `MONGODB_URL`: MongoDB connection string
- `CORS_ORIGINS`: Allowed frontend origins
- Authentication secrets for JWT validation

### Scaling
- MongoDB sharding for large event volumes
- Read replicas for analytics queries
- CDN caching for dashboard API responses

### Security
- Rate limiting on event tracking endpoints
- Authentication required for sensitive analytics
- Input validation and sanitization
- CORS configuration for frontend access

## Future Enhancements

### Planned Features
- Real-time analytics dashboard
- Custom date range filtering
- Export functionality (CSV, PDF)
- Advanced segmentation and cohort analysis
- A/B testing framework integration

### Performance Optimizations
- Event streaming with Apache Kafka
- Pre-computed aggregations for faster queries
- Data warehouse integration for historical analysis
- Machine learning insights and predictions