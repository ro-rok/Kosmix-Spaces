# Kosmix Spaces

Verified workspace listings platform for Delhi.

## What Changed

### Hero + Homepage Upgrade
- Conversion-focused hero with locality/team size/budget selectors
- WhatsApp-first CTA with prefilled messages
- Locality quick chips for fast browsing
- Featured verified spaces (6 listings)
- Trust strips with transparency messaging

### Admin UI (Frontend Only) 
- `/admin` - Dashboard with metrics overview
- `/admin/listings` - Listings table with verification workflow (includes partner submissions)
- `/admin/listings/[slug]` - Detail page with approval checklist
- `/admin/leads` - Lead pipeline (list + kanban views)
- `/admin/visits` - Site visit scheduling management

### Partner Flow (Frontend Only)
- `/partner/login` - Partner login (demo, no passwords)
- `/partner` - Partner dashboard with submission status
- `/partner/listings` - View all partner's submitted listings
- `/partner/listings/new` - Submit a new workspace listing
- `/partner/listings/[id]` - View listing detail and status

### New Features
- **Shortlist**: Save button on cards, persisted to localStorage, shareable URLs
- **Visit Request Modal**: Date/time selection with confirmation flow
- **Skeletons**: Loading states for listing grid and detail pages
- **Improved Empty States**: WhatsApp-first messaging

## Configuration

### Environment Variables
Create a `.env.local` file in the `frontend` directory:
```bash
# API Configuration
VITE_API_BASE_URL=http://localhost:8000
backend  url

# Google Maps API Key (required for location maps)
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

**Getting a Google Maps API Key:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/google/maps-apis)
2. Create a new project or select an existing one
3. Enable "Maps JavaScript API" and "Geocoding API"
4. Create an API key in Credentials
5. Add the key to your `.env.local` file

See [GOOGLE_MAPS_SETUP.md](../GOOGLE_MAPS_SETUP.md) for detailed setup instructions.

### Admin Access
Edit `src/config/admin.ts`:
- `ADMIN_ENABLED`: Set to `true` to enable admin area
- `ADMIN_PASSWORD`: Demo password (default: `kosmix2024`)

### WhatsApp Number
Edit `src/config/contact.ts`:
- `whatsappNumber`: Your WhatsApp business number

### Shortlist Share URLs
URLs like `/explore?shortlist=slug1,slug2` will show those listings.
Users can generate share links from the shortlist drawer.

## What's Mocked vs Real

| Feature | Status |
|---------|--------|
| Listings data | Static mock in `src/data/listings.ts` + approved partner listings from localStorage |
| Admin listings | Mock wrapper in `src/admin/mockData.ts` + partner drafts from localStorage |
| Partner accounts | Real (localStorage) |
| Partner sessions | Real (localStorage) |
| Partner listing drafts | Real (localStorage) |
| Approved partner listings | Real (localStorage, merged with seed listings) |
| Leads | Mock data (5 sample leads) |
| Visits | Mock data (3 sample visits) |
| Shortlist | Real (localStorage) |
| Visit requests | Real (localStorage) |
| Form submissions | localStorage (TODO: backend) |

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- React Router

## Partner Flow

### Partner Demo Login
1. Navigate to `/partner/login`
2. Enter your email (required)
3. Optionally provide workspace brand name, contact name, and phone
4. Click "Continue" - no password required (demo mode)
5. You'll be redirected to the partner dashboard

### Partner Submission Flow
1. **Submit Listing**: Go to `/partner/listings/new` and fill out the workspace form
2. **Review Status**: Check `/partner/listings` to see your submissions
3. **Status Updates**:
   - **Pending Review**: Your listing is being reviewed
   - **Needs Info**: Admin requires additional information (check notes and resubmit)
   - **Approved**: Your listing is live on the public site
   - **Rejected**: Listing was rejected (see reason)

### Admin Approval Flow
1. **View Submissions**: Go to `/admin/listings` - partner drafts appear in the "Pending Review" tab
2. **Review Draft**: Click on a draft to see full details
3. **Verification Checklist**: Complete all 5 verification checks:
   - Partner contact verified
   - Photos are authentic and current
   - Specifications match reality
   - Pricing structure confirmed
   - Address hiding policy confirmed
4. **Actions**:
   - **Approve**: Converts draft to public listing (appears on `/explore` and `/spaces/[slug]`)
   - **Needs Info**: Request additional information from partner
   - **Reject**: Reject with reason
5. **Approved listings** automatically appear on the public site with "Verified" badge

### Data Storage

All partner and listing data is stored in localStorage with versioned keys:

- `kosmix_partners_v1`: Partner accounts
- `kosmix_partner_sessions_v1`: Active partner sessions
- `kosmix_listing_drafts_v1`: Partner-submitted drafts
- `kosmix_approved_listings_v1`: Approved partner listings (merged with seed data)

**To Reset Data**: Clear localStorage in browser dev tools, or use `clearAllKosmixStorage()` from `@/lib/storage`

## Development

```sh
npm install
npm run dev
```
