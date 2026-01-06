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
- `/admin/listings` - Listings table with verification workflow
- `/admin/listings/[slug]` - Detail page with approval checklist
- `/admin/leads` - Lead pipeline (list + kanban views)
- `/admin/visits` - Site visit scheduling management

### New Features
- **Shortlist**: Save button on cards, persisted to localStorage, shareable URLs
- **Visit Request Modal**: Date/time selection with confirmation flow
- **Skeletons**: Loading states for listing grid and detail pages
- **Improved Empty States**: WhatsApp-first messaging

## Configuration

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
| Listings data | Static mock in `src/data/listings.ts` |
| Admin listings | Mock wrapper in `src/admin/mockData.ts` |
| Leads | Mock data (5 sample leads) |
| Visits | Mock data (3 sample visits) |
| Shortlist | Real (localStorage) |
| Visit requests | Real (localStorage) |
| Form submissions | localStorage (TODO: backend) |

## Tech Stack

- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui
- React Router

## Development

```sh
npm install
npm run dev
```
