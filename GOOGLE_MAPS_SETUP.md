# Google Maps Integration Setup

This guide explains how to set up and use the Google Maps integration for displaying workspace locations.

## Features

1. **Location Maps on Workspace Details**: Shows approximate location of each workspace
2. **Partner Address Input**: Partners can enter full address when creating listings
3. **Auto-Geocoding**: Automatically converts addresses to coordinates
4. **Privacy Protection**: Coordinates are rounded to 2 decimal places to show locality area (not exact address)
5. **Map Preview**: Partners can see location preview while filling the form

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - **Maps JavaScript API** (required for displaying maps)
   - **Geocoding API** (required for address-to-coordinates conversion)
4. Go to **Credentials** section
5. Click **Create Credentials** > **API Key**
6. Copy your API key

### 2. Configure Environment Variables

#### Frontend Configuration

Create or edit `.env.local` in the `frontend` directory:

```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

**Important**: Replace `your_actual_api_key_here` with your actual Google Maps API key.

### 3. Secure Your API Key (Production)

For production use, you should restrict your API key:

1. In Google Cloud Console, go to your API key settings
2. Under "Application restrictions":
   - Choose "HTTP referrers"
   - Add your domain (e.g., `https://kosmixspaces.com/*`)
3. Under "API restrictions":
   - Choose "Restrict key"
   - Select only "Maps JavaScript API" and "Geocoding API"

## How It Works

### For End Users (Public Listing Pages)

When viewing a workspace detail page (`/spaces/[slug]`):

1. The map shows an approximate location based on the locality
2. A circle overlay shows the approximate area (500m radius)
3. Privacy message: "Exact location shared after enquiry"
4. Users see locality-level information only

### For Partners (Listing Creation)

When partners create or edit a workspace listing:

1. **Enter Full Address**: In the Location Step, partners enter the complete address
   - Example: "Sri Aurobindo Marg, Block Q, Green Park Extension, Green Park, New Delhi, Delhi 110016"

2. **Geocode Address**: Click the "Geocode Address" button
   - Automatically converts address to latitude/longitude
   - Coordinates are rounded to 2 decimal places for privacy
   - Example: 28.56, 77.21

3. **Preview Map**: See how the location will appear to customers
   - Shows approximate area (not exact address)
   - Helps verify the location is correct

4. **Manual Coordinates** (Optional): Partners can also enter coordinates manually
   - Useful if geocoding doesn't work
   - Coordinates are still rounded for privacy

## Privacy Protection

### What's Public
- Locality name (e.g., "Green Park")
- City (e.g., "Delhi")
- Approximate coordinates (rounded to 2 decimal places)
- Map showing general area with ~500m radius circle

### What's Private (Internal Only)
- Exact address (stored in database but never shown publicly)
- Precise coordinates (automatically rounded before display)
- Address is only shared after customer makes an enquiry

### Coordinate Rounding
- Coordinates are rounded to 2 decimal places
- At latitude 28°N:
  - 0.01° latitude ≈ 1.11 km
  - 0.01° longitude ≈ 0.96 km
- This provides locality-level accuracy while protecting exact location

## Components

### `GoogleMap.tsx`
Main map component that displays location with privacy protection:
- Loads Google Maps JavaScript API
- Handles geocoding for addresses
- Shows circular overlay for approximate area
- Falls back to placeholder if API fails

**Usage:**
```tsx
<GoogleMap
  locality="Green Park"
  city="Delhi"
  approximateCoordinates={{ lat: 28.56, lng: 77.21 }}
/>
```

### `LocationStep.tsx`
Partner form step for entering location details:
- Address input field
- Geocoding button
- Coordinate fields
- Map preview
- Privacy notices

## Testing

### Test the Integration

1. **Start the development server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Login as a partner:**
   - Navigate to `/partner/login`
   - Enter your details

3. **Create a new listing:**
   - Go to `/partner/listings/new`
   - Fill in basic information
   - Navigate to Location step

4. **Test address geocoding:**
   - Enter a full address (e.g., "Sri Aurobindo Marg, Block Q, Green Park Extension, Green Park, New Delhi, Delhi 110016")
   - Click "Geocode Address"
   - Verify coordinates appear (should be rounded to 2 decimal places)
   - Check the map preview shows the correct area

5. **View public listing:**
   - After approval, view the workspace detail page
   - Verify the map shows approximate location
   - Confirm exact address is not visible

### Sample Test Addresses

**Green Park, Delhi:**
```
Sri Aurobindo Marg, Block Q, Green Park Extension, Green Park, New Delhi, Delhi 110016
Expected coordinates: ~28.56, 77.21
```

**Connaught Place, Delhi:**
```
Connaught Place, New Delhi, Delhi 110001
Expected coordinates: ~28.63, 77.22
```

**Cyber City, Gurugram:**
```
DLF Cyber City, Gurugram, Haryana 122002
Expected coordinates: ~28.49, 77.09
```

## Troubleshooting

### Map not displaying
- Check if `VITE_GOOGLE_MAPS_API_KEY` is set in `.env.local`
- Verify the API key is valid
- Check browser console for errors
- Ensure "Maps JavaScript API" is enabled in Google Cloud Console

### Geocoding not working
- Verify "Geocoding API" is enabled
- Check if address is specific enough
- Try more detailed address with city and pincode
- Verify API key has permission for Geocoding API

### API key errors
- Check API key restrictions in Google Cloud Console
- Verify your domain is allowed (for production)
- Ensure API key hasn't exceeded quota

### Map shows wrong location
- Verify address is correct and specific
- Try adding more details (building name, street, pincode)
- Manually adjust coordinates if needed

## Cost Considerations

### Google Maps Pricing (as of 2024)

**Maps JavaScript API:**
- First 28,000 loads per month: Free
- Additional loads: $7 per 1,000 loads

**Geocoding API:**
- First 40,000 requests per month: Free
- Additional requests: $5 per 1,000 requests

### Optimization Tips

1. **Caching**: The component caches API responses
2. **Lazy Loading**: Maps only load when component is visible
3. **Coordinate Storage**: Store coordinates to avoid repeated geocoding
4. **Static Maps**: Consider using Static Maps API for thumbnails (cheaper)

### Estimated Costs for Kosmix Spaces

Assuming:
- 100 workspace listings
- 10,000 page views/month
- 50 new listings/month (geocoding requests)

**Monthly costs:**
- Maps loads: All free (under 28,000)
- Geocoding: All free (under 40,000)
- **Total: $0/month**

## Future Enhancements

Potential improvements:

1. **Nearby Landmarks**: Show metro stations, cafes, etc.
2. **Street View**: Add Street View integration
3. **Directions**: Link to Google Maps for directions
4. **Heatmap**: Show popular workspace areas
5. **Cluster Maps**: For explore page with multiple locations
6. **Custom Markers**: Branded map markers
7. **Drawing Tools**: Let partners draw service area

## Support

For issues or questions:
- Check browser console for errors
- Verify API key configuration
- Review Google Cloud Console logs
- Test with sample addresses above


