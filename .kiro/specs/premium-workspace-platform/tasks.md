# Implementation Plan: Premium Workspace Platform

## Overview

This implementation plan converts the approved design into actionable coding tasks for upgrading the workspace listing platform to exceed Innov8's UI quality. The tasks are organized to build incrementally, starting with core utilities, then implementing the search page, listing detail page, partner portal enhancements, admin portal improvements, and finally analytics integration.

## Tasks

- [x] 0. Validate backend API integration assumptions (missing)
  - Confirm auth storage strategy in frontend (Bearer token in header; no httpOnly cookie support in current API)
  - Implement a single API client wrapper (baseURL `/api`, auth header injection, error normalization)
  - Map frontend routes to real endpoints:
    - Explore: GET `/api/public/listings`
    - Listing detail: GET `/api/public/listings/{slug}`
    - Enquiry: POST `/api/public/leads`
    - Site visit: POST `/api/public/site-visits`
    - Partner auth: POST `/api/partner/auth/register|login`, GET `/api/partner/auth/me`
    - Partner listings: GET/POST/PUT `/api/partner/listings`, POST/DELETE photos
    - Admin auth: POST `/api/admin/auth/login`, GET `/api/admin/auth/me`
    - Admin moderation: GET `/api/admin/listings`, PATCH verification, POST approve/needs-info/reject
    - Admin partners: GET `/api/admin/partners`, PATCH status
    - Admin leads/visits: GET/PATCH endpoints as provided
  - Confirm status enums and transitions are reflected in UI (PENDING_REVIEW/NEEDS_INFO/APPROVED_VERIFIED/REJECTED)
  - Define analytics reality: backend has no `/analytics/*` endpoints in current doc → either add them backend-side or defer dashboards
  - Decide and implement listing slug strategy with current API 
  - Use backend-provided `slug` from listing objects and treat it as canonical
  - Implement frontend slugify/hash only for *client-side preview* before listing is created
  - Add canonical redirect handling if URL slug differs from backend slug


- [x] 1. Set up core utilities and helpers
  - Create slug generation utilities (slugify, generateHashSuffix, resolveSlugCollision)
  - Store the slug of a listing in the mongodb
  - Implement price display formatting helper
  - Set up enhanced TypeScript interfaces for listings and offerings
  - Configure Zod validation schemas for forms
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 2.4, 2.5, 2.6, 10.1_

- [ ]* 1.1 Write property tests for slug generation
  - **Property 6: Slug Generation Consistency**
  - **Validates: Requirements 3.1, 3.3**

- [ ]* 1.2 Write property tests for slug collision resolution
  - **Property 7: Slug Collision Resolution**
  - **Validates: Requirements 3.2, 3.4**

- [ ]* 1.3 Write property tests for price display logic
  - **Property 4: Price Display Logic Consistency**
  - **Validates: Requirements 2.4, 2.5, 2.6**

- [x] 2. Implement enhanced search and explore page
  - Create debounced search hook with caching
  - Implement faceted filter components (locality multi-select, team size, budget band, amenities)
  - Add URL synchronization for search filters using URLSearchParams
  - Create premium listing cards with hero images, badges, and pricing display
  - Implement skeleton loading states for search results
  - Add sort functionality (Recommended, Most Enquired, Budget low to high)
  - Implement pagination UI using `page` + `pageSize` + `total` from `/api/public/listings`
  - Add “No results” empty state with clear next actions (reset filters, suggested localities)
  - Add applied-filters chips with one-click remove + “Clear all”
  - Add result count + active sort indicator
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_

- [ ]* 2.1 Write property tests for search filter URL synchronization
  - **Property 10: Search Filter URL Synchronization**
  - **Validates: Requirements 5.4**

- [ ]* 2.2 Write unit tests for search debouncing and caching
  - Test debounce timing (300ms)
  - Test cache invalidation scenarios
  - _Requirements: 5.1_

- [x] 3. Build premium listing detail page
  - Create responsive 2-column layout (68% content, 32% sticky enquiry card)
  - Implement mobile single-column layout with bottom sticky CTA bar
  - Build scroll-spy navigation tabs (OVERVIEW, OFFERINGS & PRICING, LOCATION, AMENITIES)
  - Create offering display components with expandable features
  - Implement location display with privacy protection (no exact addresses)
  - Add trust indicators row and verification badges
  - Integrate with existing enquiry form and WhatsApp/call functionality
  - Enquiry form submits to POST `/api/public/leads`
  - “Schedule a Visit” submits to POST `/api/public/site-visits` with `listingIds` + `preferredSlots`
  - Ensure WhatsApp deep link from lead response is used for post-submit CTA when available

  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8_

- [ ]* 3.1 Write property tests for responsive layout consistency
  - **Property 1: Responsive Layout Consistency**
  - **Validates: Requirements 1.1, 1.2**

- [ ]* 3.2 Write property tests for listing title format
  - **Property 2: Listing Title Format Consistency**
  - **Validates: Requirements 1.3**

- [ ]* 3.3 Write property tests for offering count invariant
  - **Property 3: Offering Count Invariant**
  - **Validates: Requirements 1.6, 2.1**

- [ ]* 3.4 Write property tests for location privacy protection
  - **Property 5: Location Privacy Protection**
  - **Validates: Requirements 1.8, 7.1, 7.3**

- [ ] 4. Checkpoint - Test listing detail page functionality
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Enhance partner portal with advanced listing builder
  - Upgrade listing builder to 3-step wizard (Basic Info, Offerings Editor, Location)
  - Implement 5 offering types management (Private Offices, Dedicated Desks, Hot Desks, Meeting Rooms, Event Spaces)
  - Create advanced photo upload system with drag-and-drop, progress tracking, and thumbnail management
  - Add photo validation (minimum 1 photo per enabled offering)
  - Implement offering-specific photo buckets with reorder/delete functionality
  - Integrate with existing Cloudinary backend for photo storage
  - Add "Save Draft" and "Submit for Approval" with appropriate validation
  - Current backend photo upload endpoint is listing-level: POST `/api/partner/listings/{listing_id}/photos`
  - Add client-side offering bucket assignment metadata (tag photos to one of 5 offering types) and persist it:
    - Either store in listing update payload (preferred) OR maintain a mapping in listing object if supported
  - In UI: enforce upload into a selected offering section and show separate galleries per offering
  - Draft vs Submitted vs Needs Info vs Approved Verified vs Rejected badges
  - Partner dashboard: show admin notes from verification endpoints (notes + checks)
  - Partner listing editor: lock fields when submitted, unlock only when NEEDS_INFO with reason

  - _Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 2.1, 2.2, 2.3, 2.7, 2.8_

- [ ]* 5.1 Write property tests for photo validation enforcement
  - **Property 8: Photo Validation Enforcement**
  - **Validates: Requirements 2.8, 4.7**

- [ ]* 5.2 Write property tests for partner authorization
  - **Property 9: Partner Authorization Consistency**
  - **Validates: Requirements 4.1, 4.2, 9.4**

- [ ]* 5.3 Write unit tests for photo upload functionality
  - Test multi-file upload with progress tracking
  - Test drag-and-drop interface
  - Test photo reorder and delete operations
  - _Requirements: 4.4, 4.6_

- [x] 6. Implement enhanced authentication and route guards
  - Upgrade authentication system with JWT session management
  - Implement route guards for partner and admin sections
  - Add session hydration on app load (/auth/me endpoint)
  - Handle session expiry with appropriate redirects
  - Ensure authentication state persistence across reloads
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [ ]* 6.1 Write property tests for authentication state persistence
  - **Property 12: Authentication State Persistence**
  - **Validates: Requirements 9.5, 9.6, 9.7**

- [ ]* 6.2 Write unit tests for route guard functionality
  - Test unauthorized access blocking
  - Test redirect behavior on session expiry
  - _Requirements: 9.3, 9.6_

- [-] 7. Upgrade admin portal with enhanced moderation features
  - Improve partner approval workflow with status management
  - Enhance listing moderation using the same listing detail UI with admin controls
  - Add bulk operations for partner and listing management
  - Implement admin analytics dashboard with key metrics
   - Leads inbox: GET `/api/admin/leads` with filters + status updates PATCH `/api/admin/leads/{lead_id}`
  - Site visits: GET `/api/admin/site-visits` + update PATCH `/api/admin/site-visits/{visit_id}`
  - Show lead → visit linkage (leadId), assignment, priority, and confirmed slot

  - _Requirements: 4.1, 4.2, 6.4_

- [ ]* 7.1 Write unit tests for admin moderation workflows
  - Test partner approval/rejection flows
  - Test listing approval/rejection with notes
  - _Requirements: 4.1, 4.2_

- [x] 8. Implement comprehensive analytics system
  - Create analytics client with event batching (POST /analytics/events)
  - Track key events: listing_view, enquiry_submit, whatsapp_click, call_click, search_performed, filter_applied, partner_signup, partner_listing_submitted
  - Implement privacy-compliant event structure (no PII, include role/listingId/timestamp/referrer)
  - Build admin analytics dashboard (total searches, enquiries, partner signups, top localities, top listings)
  - Create partner analytics view (views, enquiries, conversion rate via GET /analytics/partner/:id)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [ ]* 8.1 Write property tests for analytics event structure
  - **Property 11: Analytics Event Structure Consistency**
  - **Validates: Requirements 6.1, 6.2**

- [ ]* 8.2 Write unit tests for analytics batching behavior
  - Test event queuing and batch sending
  - Test batch size and timing configuration
  - _Requirements: 6.3_

- [-] 9. Implement premium design system enhancements
  - Upgrade typography scale with modern font hierarchy
  - Implement premium spacing rhythm and section separation
  - Create premium card components with subtle borders and shadows
  - Add smooth transitions for feature expansion and tab scrolling
  - Implement sticky CTA bar on mobile with Call, WhatsApp, and Enquire actions
  - Ensure consistent design token usage throughout
  - Add skeleton loading states for all async content
  - Implement smooth micro-interactions and hover states
    - Verify Explore filters UX on mobile (drawer/bottom-sheet)
  - Ensure listing sticky CTA bar on mobile is always visible and not covering content
  - Ensure partner wizard forms are usable on small screens (stepper becomes compact, sticky “Save Draft”)
  - Ensure admin tables degrade gracefully on mobile (horizontal scroll + stacked rows)
  -Implemnet the backend as well with database for the task
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [ ]* 9.1 Write property tests for design system consistency
  - **Property 15: Design System Consistency**
  - **Validates: Requirements 8.1, 8.2, 8.6**

- [ ]* 9.2 Write unit tests for responsive CTA bar behavior
  - Test mobile CTA bar appearance and actions
  - Test desktop sticky enquiry card behavior
  - _Requirements: 8.5_

- [ ] 10. Implement advanced form validation and error handling
  - Integrate Zod validation schemas across all forms
  - Add real-time validation feedback with inline error messages
  - Implement loading states with progress indicators for form submissions
  - Add toast notifications for success and error states
  - Handle network errors gracefully with retry options
  - Prevent duplicate submissions during processing
   - Normalize `{ error: { code, message, details } }` into a single toast/inline pattern
  - Show validation details (422) inline at field-level where applicable
  - Provide retry action for transient failures (network/500)

  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7_

- [ ]* 10.1 Write property tests for form validation real-time feedback
  - **Property 13: Form Validation Real-time Feedback**
  - **Validates: Requirements 10.1, 10.2, 10.4**

- [ ]* 10.2 Write unit tests for error handling scenarios
  - Test network error retry logic
  - Test duplicate submission prevention
  - Test toast notification triggers
  - _Requirements: 10.5, 10.6, 10.7_

- [ ] 11. Implement performance optimizations
  - Add lazy loading for images with progressive enhancement
  - Implement image compression and thumbnail optimization
  - Ensure non-blocking UI during photo uploads with progress indicators
  - Add efficient caching strategies for API responses
  - Replace spinners with skeleton loading states
  - Implement code splitting for different user roles
  - Add efficient re-rendering strategies to prevent unnecessary updates
    - Enforce file type whitelist (jpg/jpeg/png/webp)
  - Enforce max file size and max count per offering bucket
  - Show progress, allow cancel/retry, and prevent UI freeze during uploads
  - Use responsive images/thumbnails in UI (use returned metadata if available)

  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

- [ ]* 11.1 Write property tests for upload progress non-blocking
  - **Property 14: Upload Progress Non-blocking**
  - **Validates: Requirements 11.3, 4.4**

- [ ]* 11.2 Write unit tests for performance optimizations
  - Test lazy loading behavior
  - Test caching strategies
  - Test code splitting effectiveness
  - _Requirements: 11.1, 11.4, 11.6_

- [ ] 12. Final integration and testing
  - Integrate all components and ensure seamless navigation
  - Test cross-browser compatibility and mobile responsiveness
  - Verify all API integrations work correctly
  - Ensure analytics tracking works across all user journeys
  - Test error scenarios and recovery paths
  - Validate accessibility compliance (keyboard navigation, screen readers)
  - Keyboard navigation for tabs + focus states
  - Proper labels/aria for all form fields and icon buttons (WhatsApp/Call)
  - Color contrast checks for badges and CTA buttons
  - _Requirements: All requirements integration testing_

- [ ]* 12.1 Write integration tests for critical user journeys
  - Test customer discovery and enquiry flow
  - Test partner registration and listing creation flow
  - Test admin moderation workflows
  - _Requirements: Cross-cutting integration_

- [ ] 13. Final checkpoint - Comprehensive testing and deployment preparation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation and user feedback
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests ensure components work together correctly
- The implementation maintains existing backend integration while adding premium features