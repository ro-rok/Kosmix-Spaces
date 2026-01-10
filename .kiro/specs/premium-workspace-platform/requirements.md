# Requirements Document

## Introduction

This specification defines the requirements for upgrading the existing workspace listing platform to a premium, industry-leading solution that surpasses Innov8's UI quality while maintaining the current backend integration and core functionality. The platform enables workspace partners to list their spaces, customers to discover and enquire about workspaces, and administrators to manage the entire ecosystem.

## Glossary

- **Platform**: The complete workspace listing web application
- **Partner**: Workspace owners who list their spaces on the platform
- **Customer**: Users searching for and enquiring about workspace listings
- **Admin**: Platform administrators who moderate partners and listings
- **Listing**: A workspace entry with details, photos, and pricing information
- **Offering**: One of five workspace types (Private Offices, Dedicated Desks, Hot Desks, Meeting Rooms, Event Spaces)
- **Enquiry**: Customer request for information about a workspace
- **Slug**: URL-friendly identifier for listings in format /listing/{partnerSlug}/{localitySlug}/{nameSlug}
- **Analytics_System**: Event tracking and reporting system for user interactions

## Requirements

### Requirement 1: Premium Listing Detail Page

**User Story:** As a customer, I want to view detailed workspace information in a premium, visually appealing interface, so that I can make informed decisions about workspace selection.

#### Acceptance Criteria

1. WHEN a customer visits a listing detail page, THE Platform SHALL display a responsive 2-column layout on desktop (68% content, 32% sticky enquiry card)
2. WHEN viewing on mobile, THE Platform SHALL display a single column layout with bottom sticky CTA bar containing Call, WhatsApp, and Enquire actions
3. WHEN displaying listing information, THE Platform SHALL show title as "{Name}, {Locality}" with subtitle "{Locality}, {City}" and verification badge if approved
4. THE Platform SHALL display a trust row with "Verified listing", "Response within 24 hours", and "No customer fees" indicators
5. WHEN rendering navigation tabs, THE Platform SHALL provide smooth scroll-spy functionality for OVERVIEW, OFFERINGS & PRICING, LOCATION, and AMENITIES sections
6. WHEN displaying offerings, THE Platform SHALL render 5 offering rows with expandable features, pricing display, and image cards
7. WHEN showing location information, THE Platform SHALL display locality + city with "Exact location shared after enquiry" and approximate map preview
8. THE Platform SHALL never display exact address text or building-level map coordinates

### Requirement 2: Advanced Offering Management System

**User Story:** As a partner, I want to manage five distinct workspace offerings with detailed customization, so that I can accurately represent my workspace capabilities.

#### Acceptance Criteria

1. THE Platform SHALL support exactly 5 offering types: Private Offices, Dedicated Desks, Hot Desks, Meeting Rooms, Event Spaces
2. FOR each offering, THE Platform SHALL allow enable/disable toggle, editable description, editable features list, and multiple photo uploads
3. WHEN setting pricing, THE Platform SHALL support startingPrice (number), unit ("month" or "hr" or "NA"), and budgetBand (₹₹/₹₹₹ or numeric)
4. WHEN startingPrice exists, THE Platform SHALL display "Starting ₹ X / {unit}"
5. WHEN only budgetBand exists, THE Platform SHALL display "Budget {band}"
6. WHEN neither exists, THE Platform SHALL display "On enquiry"
7. THE Platform SHALL store photos in offering-specific buckets with reorder and delete functionality
8. WHEN validating submissions, THE Platform SHALL require at least 1 photo for enabled offerings before allowing "submit for approval"

### Requirement 3: Intelligent Slug-Based Routing System

**User Story:** As a customer, I want to access listings through clean, SEO-friendly URLs, so that I can easily share and bookmark specific workspaces.

#### Acceptance Criteria

1. THE Platform SHALL generate slugs in format /listing/{partnerSlug}/{localitySlug}/{nameSlug}
2. WHEN slug collision occurs, THE Platform SHALL append -{hash6} deterministic suffix
3. THE Platform SHALL implement slugify() helper for URL-safe string conversion
4. THE Platform SHALL implement generateHashSuffix() helper for collision resolution
5. THE Platform SHALL resolve listings by slug via GET /listings/by-slug?slug=... endpoint
6. WHEN backend lacks slug endpoint, THE Platform SHALL fall back to listingId and store slug in listing object

### Requirement 4: Enhanced Partner Portal with Photo Management

**User Story:** As a partner, I want a polished portal to manage my workspace listings with advanced photo upload capabilities, so that I can effectively showcase my spaces.

#### Acceptance Criteria

1. WHEN partner registers, THE Platform SHALL create account with status "pending" requiring admin approval
2. WHEN partner is approved, THE Platform SHALL allow listing creation and management
3. THE Platform SHALL provide listing builder with 3 steps: Basic Info, Offerings Editor, Location
4. WHEN uploading photos, THE Platform SHALL support multiple images per offering with progress indicators
5. THE Platform SHALL integrate with existing Cloudinary backend for photo storage
6. WHEN managing photos, THE Platform SHALL allow thumbnail grid display, reorder, and delete operations
7. THE Platform SHALL validate photo requirements before allowing "Submit for Approval"
8. WHEN saving listings, THE Platform SHALL support "Save Draft" and "Submit for Approval" with appropriate validation

### Requirement 5: Advanced Search and Filtering System

**User Story:** As a customer, I want fast, comprehensive search with faceted filtering, so that I can quickly find workspaces matching my specific requirements.

#### Acceptance Criteria

1. THE Platform SHALL provide debounced search with skeleton loading states and result caching
2. THE Platform SHALL support faceted filters: locality (multi), team size, budget band, meeting rooms, private cabin, verified only, amenities multi-select
3. THE Platform SHALL provide sort options: Recommended (default), Most Enquired, Budget low to high
4. THE Platform SHALL sync filters with URL query parameters for shareable links
5. WHEN displaying results, THE Platform SHALL show premium cards with hero image, name + locality, badges, and pricing
6. THE Platform SHALL call backend GET /search?query=&filters=... endpoint
7. WHEN backend supports facets, THE Platform SHALL use server-driven facets; otherwise compute client-side with TODO marker

### Requirement 6: Comprehensive Analytics and Event Tracking

**User Story:** As an admin and partner, I want detailed analytics on user behavior and listing performance, so that I can optimize the platform and workspace offerings.

#### Acceptance Criteria

1. THE Analytics_System SHALL track events: listing_view, enquiry_submit, whatsapp_click, call_click, search_performed, filter_applied, partner_signup, partner_listing_submitted
2. WHEN tracking events, THE Analytics_System SHALL include session user role (partner/admin/anon), listingId + slug when relevant, timestamp, and referrer
3. THE Analytics_System SHALL batch events and send to POST /analytics/events endpoint
4. THE Platform SHALL provide admin dashboard with total searches, enquiries, partner signups, listing views, top localities, top listings by enquiries
5. THE Platform SHALL provide partner analytics with views, enquiries, conversion rate via GET /analytics/partner/:id
6. WHEN analytics endpoints don't exist, THE Platform SHALL implement UI with mock data and TODO markers

### Requirement 7: Location Privacy and Security

**User Story:** As a partner, I want to protect my exact workspace location while still providing useful location information to customers, so that I can maintain security while enabling discovery.

#### Acceptance Criteria

1. THE Platform SHALL never display exact address text in any public interface
2. THE Platform SHALL always show locality + city information
3. WHEN displaying maps, THE Platform SHALL use approximate coordinates (rounded to locality center or 2 decimal places)
4. THE Platform SHALL display "Exact location shared after enquiry" disclaimer on all location displays
5. WHEN partner adds location, THE Platform SHALL accept only locality + city + optional approximate coordinates
6. THE Platform SHALL ignore address line fields if present in backend data

### Requirement 8: Premium Design System Implementation

**User Story:** As a customer, I want a visually superior interface that exceeds Innov8's design quality, so that I have confidence in the platform's professionalism and reliability.

#### Acceptance Criteria

1. THE Platform SHALL implement modern typography scale with clear H1, subheads, and muted helper text
2. THE Platform SHALL use premium spacing rhythm and section separation throughout
3. THE Platform SHALL display premium cards with subtle borders and shadows
4. THE Platform SHALL provide smooth transitions for feature expansion and tab scrolling
5. THE Platform SHALL implement sticky CTA bar on mobile with 2 primary actions (Call + WhatsApp) and secondary (Enquire)
6. THE Platform SHALL use consistent design tokens for colors, spacing, and typography
7. THE Platform SHALL implement skeleton loading states for all async content
8. THE Platform SHALL provide smooth micro-interactions and hover states

### Requirement 9: Multi-Role Authentication and Authorization

**User Story:** As a platform user, I want secure, role-based access to different platform features, so that I can access appropriate functionality based on my user type.

#### Acceptance Criteria

1. THE Platform SHALL support three user roles: anonymous customer, partner, admin
2. THE Platform SHALL use JWT-based session management with httpOnly cookies preferred
3. THE Platform SHALL implement route guards for partner and admin sections
4. WHEN partner accesses listing submission, THE Platform SHALL require approved status
5. THE Platform SHALL call /auth/me endpoint on app load for session hydration
6. WHEN session expires, THE Platform SHALL redirect to appropriate login page
7. THE Platform SHALL handle authentication state across app reload and navigation

### Requirement 10: Form Validation and Error Handling

**User Story:** As a platform user, I want clear validation feedback and error handling, so that I can successfully complete forms and understand any issues.

#### Acceptance Criteria

1. THE Platform SHALL use Zod validation library for all form validation
2. THE Platform SHALL provide real-time validation feedback on form fields
3. THE Platform SHALL display loading states with progress indicators during form submission
4. WHEN validation fails, THE Platform SHALL show inline error messages with specific guidance
5. THE Platform SHALL implement toast notifications for success and error states
6. THE Platform SHALL handle network errors gracefully with retry options
7. THE Platform SHALL prevent duplicate submissions during processing

### Requirement 11: Performance and Optimization

**User Story:** As a customer, I want fast page loads and smooth interactions, so that I can efficiently browse and evaluate workspace options.

#### Acceptance Criteria

1. THE Platform SHALL implement lazy loading for images with progressive enhancement
2. THE Platform SHALL compress and optimize thumbnail images for fast loading
3. THE Platform SHALL not block UI during photo uploads with progress indicators
4. THE Platform SHALL implement efficient caching strategies for API responses
5. THE Platform SHALL use skeleton loading states instead of spinners for better perceived performance
6. THE Platform SHALL optimize bundle size with code splitting for different user roles
7. THE Platform SHALL implement efficient re-rendering strategies to prevent unnecessary updates