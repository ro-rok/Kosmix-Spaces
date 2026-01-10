/**
 * Application constants
 */

import { OfferingType } from '@/types/models';

// Offering configuration
export const OFFERING_TYPES: OfferingType[] = [
  'private-offices',
  'dedicated-desks',
  'hot-desks',
  'meeting-rooms',
  'event-spaces',
];

export const OFFERING_TITLES: Record<OfferingType, string> = {
  'private-offices': 'Private Offices',
  'dedicated-desks': 'Dedicated Desks',
  'hot-desks': 'Hot Desks',
  'meeting-rooms': 'Meeting Rooms',
  'event-spaces': 'Event Spaces',
};

export const OFFERING_DESCRIPTIONS: Record<OfferingType, string> = {
  'private-offices': 'Fully enclosed private offices for teams and individuals',
  'dedicated-desks': 'Fixed desks assigned to specific members',
  'hot-desks': 'Flexible seating on a first-come, first-served basis',
  'meeting-rooms': 'Bookable meeting and conference rooms',
  'event-spaces': 'Large spaces for events, workshops, and gatherings',
};

// Photo upload constraints
export const PHOTO_UPLOAD_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_OFFERING: 10,
  MIN_FILES_PER_ENABLED_OFFERING: 1,
  ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.webp'],
};

// Form validation constants
export const VALIDATION_LIMITS = {
  DISPLAY_NAME: { MIN: 2, MAX: 100 },
  OVERVIEW: { MIN: 10, MAX: 1000 },
  OFFERING_TITLE: { MIN: 1, MAX: 100 },
  OFFERING_DESCRIPTION: { MAX: 500 },
  CONTACT_NAME: { MIN: 2, MAX: 50 },
  WORKSPACE_BRAND_NAME: { MIN: 2, MAX: 100 },
  COMPANY_NAME: { MAX: 100 },
  NOTES: { MAX: 500 },
  PASSWORD: { MIN: 8 },
  MAX_VISITORS: 20,
};

// Search and pagination
export const SEARCH_CONFIG = {
  DEBOUNCE_DELAY: 300, // milliseconds
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 50,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
};

// Location privacy
export const LOCATION_PRIVACY = {
  COORDINATE_PRECISION: 2, // decimal places
  PRIVACY_DISCLAIMER: 'Exact location shared after enquiry',
  DEFAULT_CITY: 'Delhi',
};

// Analytics configuration
export const ANALYTICS_CONFIG = {
  BATCH_SIZE: 10,
  FLUSH_INTERVAL: 5000, // 5 seconds
  MAX_QUEUE_SIZE: 100,
};

// Common amenities list
export const COMMON_AMENITIES = [
  'High-speed WiFi',
  'Air Conditioning',
  'Power Backup',
  'Parking',
  'Security',
  'Cafeteria',
  'Printer/Scanner',
  'Meeting Rooms',
  'Phone Booths',
  'Lounge Area',
  'Kitchen',
  'Reception',
  'CCTV',
  'Housekeeping',
  'Tea/Coffee',
];

// Common features for offerings
export const COMMON_FEATURES = {
  'private-offices': [
    'Lockable door',
    'Window view',
    'Whiteboard',
    'Storage cabinet',
    'Ergonomic chairs',
    'Adjustable desk',
  ],
  'dedicated-desks': [
    'Personal storage',
    'Ergonomic chair',
    'Monitor mount',
    'Desk lamp',
    'Cable management',
    'Under-desk drawer',
  ],
  'hot-desks': [
    'Flexible seating',
    'Shared amenities',
    'Quick setup',
    'Mobile storage',
    'Charging points',
    'Collaborative space',
  ],
  'meeting-rooms': [
    'Video conferencing',
    'Projector/TV',
    'Whiteboard',
    'Conference table',
    'Sound system',
    'Air conditioning',
  ],
  'event-spaces': [
    'Flexible layout',
    'Audio/Visual equipment',
    'Stage/Podium',
    'Catering support',
    'Parking space',
    'Registration area',
  ],
};

// Budget bands
export const BUDGET_BANDS = [
  { value: '5k-10k', label: '₹5K - 10K/seat' },
  { value: '10k-20k', label: '₹10K - 20K/seat' },
  { value: '20k-40k', label: '₹20K - 40K/seat' },
  { value: '40k-80k', label: '₹40K - 80K/seat' },
  { value: '80k+', label: '₹80K+/seat' },
];

// Team size bands
export const TEAM_SIZE_BANDS = [
  { value: '1-5', label: '1-5 people' },
  { value: '6-15', label: '6-15 people' },
  { value: '16-30', label: '16-30 people' },
  { value: '31-50', label: '31-50 people' },
  { value: '50+', label: '50+ people' },
];

// Sort options
export const SORT_OPTIONS = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'most-enquired', label: 'Most Enquired' },
  { value: 'budget-low', label: 'Budget: Low to High' },
];

// Time slots for site visits
export const TIME_SLOTS = [
  { value: '09:00-10:00', label: '9:00 AM - 10:00 AM' },
  { value: '10:00-11:00', label: '10:00 AM - 11:00 AM' },
  { value: '11:00-12:00', label: '11:00 AM - 12:00 PM' },
  { value: '12:00-13:00', label: '12:00 PM - 1:00 PM' },
  { value: '14:00-15:00', label: '2:00 PM - 3:00 PM' },
  { value: '15:00-16:00', label: '3:00 PM - 4:00 PM' },
  { value: '16:00-17:00', label: '4:00 PM - 5:00 PM' },
  { value: '17:00-18:00', label: '5:00 PM - 6:00 PM' },
];

// Status badges configuration
export const STATUS_BADGES = {
  VERIFICATION: {
    PENDING_REVIEW: { label: 'Pending Review', variant: 'secondary' as const },
    NEEDS_INFO: { label: 'Needs Info', variant: 'destructive' as const },
    APPROVED_VERIFIED: { label: 'Verified', variant: 'default' as const },
    REJECTED: { label: 'Rejected', variant: 'destructive' as const },
  },
  PARTNER: {
    PENDING: { label: 'Pending', variant: 'secondary' as const },
    ACTIVE: { label: 'Active', variant: 'default' as const },
    SUSPENDED: { label: 'Suspended', variant: 'destructive' as const },
  },
  LISTING: {
    draft: { label: 'Draft', variant: 'outline' as const },
    submitted: { label: 'Submitted', variant: 'secondary' as const },
    approved: { label: 'Approved', variant: 'default' as const },
    rejected: { label: 'Rejected', variant: 'destructive' as const },
    published: { label: 'Published', variant: 'default' as const },
  },
};

// Error messages
export const ERROR_MESSAGES = {
  NETWORK: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'Please log in to continue.',
  FORBIDDEN: 'You don\'t have permission for this action.',
  NOT_FOUND: 'The requested item was not found.',
  VALIDATION: 'Please fix the highlighted errors.',
  SERVER: 'Something went wrong. Please try again later.',
  UPLOAD_FAILED: 'File upload failed. Please try again.',
  UPLOAD_TOO_LARGE: 'File is too large. Maximum size is 10MB.',
  UPLOAD_INVALID_TYPE: 'Invalid file type. Please upload JPG, PNG, or WebP images.',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LISTING_SAVED: 'Listing saved successfully',
  LISTING_SUBMITTED: 'Listing submitted for review',
  PHOTO_UPLOADED: 'Photo uploaded successfully',
  ENQUIRY_SENT: 'Enquiry sent successfully',
  VISIT_REQUESTED: 'Site visit requested successfully',
  PARTNER_REGISTERED: 'Registration successful. Please wait for approval.',
};