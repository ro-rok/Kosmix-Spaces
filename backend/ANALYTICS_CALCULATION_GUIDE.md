# Analytics Calculation Guide

## How Analytics Metrics Are Calculated

### Top Workspaces
**Calculation Method:**
1. Query events with `LISTING_VIEW` or `ENQUIRY_SUBMIT` in the date range
2. Group events by partner:
   - If event has `partnerId`, use it directly
   - If event has `listingId` but no `partnerId`, resolve partnerId from the listing document
   - If event has `listingSlug` but no `partnerId`, resolve listing by slug first, then get partnerId
3. Aggregate views and enquiries per partner
4. Calculate conversion rate: (enquiries / views) * 100
5. Sort by views (descending) and return top N

**Requirements:**
- Events must have either `partnerId`, `listingId`, or `listingSlug` set
- Events must be of type `LISTING_VIEW` or `ENQUIRY_SUBMIT`
- Listings must exist in `premium_listings` collection with valid `partnerId`

**Why it might be empty:**
- No events in the selected date range
- Events don't have listing context (no listingId, listingSlug, or partnerId)
- Listings referenced in events don't exist or don't have partnerId set

### Top Localities
**Calculation Method:**
1. Query events with `LISTING_VIEW` or `ENQUIRY_SUBMIT` in the date range
2. Group events by locality:
   - If event has `locality` field, use it directly
   - If event has `listingId` but no `locality`, resolve locality from the listing document
   - If event has `listingSlug` but no `locality`, resolve listing by slug first, then get locality
3. Aggregate views and enquiries per locality
4. Calculate conversion rate: (enquiries / views) * 100
5. Sort by views (descending) and return top N

**Requirements:**
- Events must have either `locality`, `listingId`, or `listingSlug` set
- Events must be of type `LISTING_VIEW` or `ENQUIRY_SUBMIT`
- Listings must exist in `premium_listings` collection with valid `location.locality` or `locality` field

**Why it might be empty:**
- No events in the selected date range
- Events don't have locality or listing context
- Listings referenced in events don't exist or don't have locality set

### Insights
**Calculation Method:**
1. **Activity Summary**: Shows total views, enquiries, clicks if any exist
2. **Best Locality**: Uses `get_top_localities(limit=1)` - shows top locality by views
3. **Top Channel**: Aggregates enquiries by `referrerDomain` to find top referrer
4. **Conversion Rate**: Calculated from overview metrics (views to enquiries)
5. **Engagement Rate**: Calculated from overview metrics (clicks per view)

**Requirements:**
- At least some events in the date range
- For channel insights: enquiries must have `referrerDomain` set
- For locality insights: must have events with locality data

**Why it might be empty:**
- No events in the selected date range
- Events exist but don't have the required fields (locality, referrerDomain, etc.)
- All insights conditions are not met (e.g., conversion rate is 0, no referrers, etc.)

## Data Enrichment

Events are enriched server-side when tracked:
- `listingId` → resolves `partnerId`, `locality`, `city` from listing
- `listingSlug` → resolves listing, then gets `partnerId`, `locality`, `city`
- `referrerDomain` → extracted from referrer URL
- `locality` → set from listing's location data

**Note**: Old events that were tracked before enrichment was implemented might not have these fields. The queries now try to resolve missing fields on-the-fly by looking up listings.

## Troubleshooting Empty Results

1. **Check if events exist**: Query `analytics_events` collection for the date range
2. **Check event fields**: Verify events have `listingId`, `listingSlug`, or `partnerId`/`locality`
3. **Check listings**: Verify listings exist and have `partnerId` and `location.locality` set
4. **Check date range**: Make sure the selected date range has events
5. **Check event types**: Only `LISTING_VIEW` and `ENQUIRY_SUBMIT` are used for top performers

## Example Queries to Debug

```javascript
// Check events in date range
db.analytics_events.find({
  timestamp: { $gte: ISODate("2024-01-01"), $lte: ISODate("2024-01-31") },
  eventName: { $in: ["listing_view", "enquiry_submit"] }
}).count()

// Check events with partnerId
db.analytics_events.find({
  timestamp: { $gte: ISODate("2024-01-01"), $lte: ISODate("2024-01-31") },
  partnerId: { $exists: true, $ne: null }
}).count()

// Check events with locality
db.analytics_events.find({
  timestamp: { $gte: ISODate("2024-01-01"), $lte: ISODate("2024-01-31") },
  locality: { $exists: true, $ne: null }
}).count()
```
