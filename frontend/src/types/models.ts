export type WorkspaceType = "dedicated-desk" | "private-cabin" | "managed-office";
export type BudgetBand = "5k-10k" | "10k-20k" | "20k-40k" | "40k-80k" | "80k+";
export type VerificationStatus = "verified" | "pending" | "needs-info" | "approved-verified" | "rejected" | "unverified";
export type AvailabilityStatus = "available" | "limited" | "waitlist";

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

export const workspaceTypeLabels: Record<WorkspaceType, string> = {
  "dedicated-desk": "Dedicated Desk",
  "private-cabin": "Private Cabin",
  "managed-office": "Managed Office",
};

export const budgetBandLabels: Record<BudgetBand, string> = {
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

export interface PartnerAccount {
  partnerId: string;
  workspaceBrandName: string;
  contactName: string;
  phone: string;
  email: string;
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface PartnerSession {
  partnerId: string;
  email: string;
  token: string;
  createdAt: string;
}

export interface WorkspaceDraftListing extends Omit<Listing, "verificationStatus" | "slug"> {
  draftId: string;
  slug?: string; // Optional until approved
  partnerId: string;
  verificationStatus: VerificationStatus;
  submittedAt: string;
  updatedAt: string;
  adminNotes?: string;
  rejectionReason?: string;
  verificationChecklist?: {
    partnerContactVerified: boolean;
    photosVerified: boolean;
    specsVerified: boolean;
    pricingStructureConfirmed: boolean;
    addressHidingConfirmed: boolean;
  };
  auditTrail?: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  action: string;
  actorRole: "admin" | "partner" | "system";
  timestamp: string;
  notes?: string;
}

export interface AdminVerification {
  checks: {
    partnerContactVerified: boolean;
    photosVerified: boolean;
    specsVerified: boolean;
    pricingStructureConfirmed: boolean;
    addressHidingConfirmed: boolean;
  };
  status: VerificationStatus;
  notes?: string;
  auditTrail: AuditEntry[];
}
