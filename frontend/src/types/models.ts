export type WorkspaceType = "dedicated-desk" | "private-cabin" | "managed-office";
export type BudgetBand = "5k-10k" | "10k-20k" | "20k-40k" | "40k-80k" | "80k+";

// Updated verification status to match backend enums
export type VerificationStatus = "PENDING_REVIEW" | "NEEDS_INFO" | "APPROVED_VERIFIED" | "REJECTED";
export type PartnerStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type LeadStatus = "NEW" | "IN_PROGRESS" | "CONVERTED" | "CLOSED" | "VISIT_REQUESTED";
export type VisitStatus = "REQUESTED" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

export type AvailabilityStatus = "available" | "limited" | "waitlist";

// Enhanced offering types for the new system
export type OfferingType = "private-offices" | "dedicated-desks" | "hot-desks" | "meeting-rooms" | "event-spaces";

// Search filters interface for enhanced search
export interface SearchFilters {
  locality: string[];
  teamSize: string;
  budgetBand: string[];
  meetingRooms: boolean;
  privateOffice: boolean;
  verifiedOnly: boolean;
  amenities: string[];
}

// Location data interface
export interface LocationData {
  locality: string;
  city: string;
  approximateCoordinates?: {
    lat: number; // rounded to 2 decimal places
    lng: number; // rounded to 2 decimal places
  };
  accessHours?: string;
  customAccessHours?: string;
  weekendAccess?: boolean;
  twentyFourSevenAccess?: boolean;
  nearMetro?: boolean;
  metroDetails?: string;
  parking?: string;
  parkingNotes?: string;
  powerBackup?: boolean;
  internetSpeedMbps?: number;
  wifiDetails?: string;
  houseRules?: string;
  specialInstructions?: string;
}

export interface Listing {
  slug: string;
  displayName: string;
  locality: string;
  localityId: string;
  city: string;
  workspaceTypes: WorkspaceType[];
  photos: string[];
  seatCapacityMin: number;
  seatCapacityMax: number;
  availabilityStatus: AvailabilityStatus;
  budgetBand: BudgetBand;
  pricingMode: "on-enquiry";
  nearMetro: boolean;
  metroNote?: string;
  parking: boolean;
  powerBackup: boolean;
  gstInvoiceAvailable: boolean;
  accessHours: string;
  amenities: string[];
  meetingRoomsAddon: boolean;
  dealTags: string[];
  verificationStatus: VerificationStatus;
  highlights: string[];
  overview: string;
  createdAt: string;
}

// Enhanced offering data structure for the new system
export interface OfferingData {
  type: OfferingType;
  title: string;
  description: string;
  features: string[];
  startingPrice?: number;
  unit?: 'month' | 'hr' | 'NA';
  budgetBand?: string;
  photos: string[];
  enabled: boolean;
}

// Offering form data with upload progress tracking
export interface OfferingFormData extends OfferingData {
  uploadProgress: Record<string, number>;
}

// Enhanced listing data for the new system
export interface EnhancedListing {
  // Core identification
  listingId: string;
  slug: string;
  partnerId: string;
  
  // Basic information
  displayName: string;
  locality: string;
  city: string;
  overview: string;
  
  // Status and verification
  status: 'pending' | 'approved' | 'rejected';
  verificationStatus: VerificationStatus;
  
  // Offerings (5 types)
  offerings: {
    privateOffices: OfferingData;
    dedicatedDesks: OfferingData;
    hotDesks: OfferingData;
    meetingRooms: OfferingData;
    eventSpaces: OfferingData;
  };
  
  // Location (privacy-protected)
  location: {
    locality: string;
    city: string;
    approximateCoordinates?: {
      lat: number; // rounded to 2 decimal places
      lng: number; // rounded to 2 decimal places
    };
  };
  
  // Metadata
  amenities: string[];
  capacity: {
    min: number;
    max: number;
  };
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Listing builder state interface
export interface ListingBuilderState {
  step: 'basic-info' | 'offerings' | 'location';
  data: ListingFormData;
  validationErrors: Record<string, string>;
}

// Complete listing form data
export interface ListingFormData {
  basicInfo: BasicInfoData;
  offerings: Record<OfferingType, OfferingFormData>;
  location: LocationData;
}

// Basic info data for listing builder
export interface BasicInfoData {
  displayName: string;
  locality: string;
  city: string;
  overview: string;
  amenities: string[];
  accessHours?: string;
  weekendAccess?: boolean;
}

// Search state interface
export interface SearchState {
  query: string;
  filters: SearchFilters;
  sort: 'recommended' | 'most-enquired' | 'budget-low';
  page: number;
}

// Search filters interface - moved to top of file

// Analytics event interface
export interface AnalyticsEvent {
  eventName: string;
  timestamp: number;
  userId?: string;
  userRole: 'anon' | 'partner' | 'admin';
  listingId?: string;
  listingSlug?: string;
  referrer?: string;
  path: string;
  metadata?: Record<string, any>;
}

export const workspaceTypeLabels: Record<WorkspaceType, string> = {
  "dedicated-desk": "Dedicated Desk",
  "private-cabin": "Private Cabin",
  "managed-office": "Managed Office",
};

// Offering type labels for the new system
export const offeringTypeLabels: Record<OfferingType, string> = {
  "private-offices": "Private Offices",
  "dedicated-desks": "Dedicated Desks", 
  "hot-desks": "Hot Desks",
  "meeting-rooms": "Meeting Rooms",
  "event-spaces": "Event Spaces",
};

// Default offering titles
export const defaultOfferingTitles: Record<OfferingType, string> = {
  "private-offices": "Private Offices",
  "dedicated-desks": "Dedicated Desks",
  "hot-desks": "Hot Desks", 
  "meeting-rooms": "Meeting Rooms",
  "event-spaces": "Event Spaces",
};

// Backend format labels
export const backendWorkspaceTypeLabels: Record<string, string> = {
  "DEDICATED_DESKS": "Dedicated Desk",
  "PRIVATE_CABINS": "Private Cabin", 
  "MANAGED_OFFICE": "Managed Office",
  "MEETING_ROOMS_ADDON": "Meeting Rooms",
};

export const budgetBandLabels: Record<BudgetBand, string> = {
  "5k-10k": "₹5K - 10K/seat",
  "10k-20k": "₹10K - 20K/seat",
  "20k-40k": "₹20K - 40K/seat",
  "40k-80k": "₹40K - 80K/seat",
  "80k+": "₹80K+/seat",
};

// Backend format budget band labels (same values work for both)
export const backendBudgetBandLabels: Record<string, string> = {
  "5k-10k": "₹5K - 10K/seat",
  "10k-20k": "₹10K - 20K/seat", 
  "20k-40k": "₹20K - 40K/seat",
  "40k-80k": "₹40K - 80K/seat",
  "80k+": "₹80K+/seat",
};

export const teamSizeBands = [
  { value: "1-5", label: "1-5 people" },
  { value: "6-15", label: "6-15 people" },
  { value: "16-30", label: "16-30 people" },
  { value: "31-50", label: "31-50 people" },
  { value: "50+", label: "50+ people" },
];
