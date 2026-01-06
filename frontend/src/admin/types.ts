import { Listing, VerificationStatus } from "@/data/listings";

// Admin-specific types
export type AdminVerificationStatus = "pending" | "approved" | "rejected" | "suspended";

export interface AdminListing extends Listing {
  adminStatus: AdminVerificationStatus;
  verificationChecklist: {
    partnerContactVerified: boolean;
    photosVerified: boolean;
    specsVerified: boolean;
    pricingStructureConfirmed: boolean;
    addressHidingConfirmed: boolean;
  };
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  notes?: string;
}

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  localityPrefs: string[];
  teamSizeBand: string;
  budgetBand: string;
  spaceType: string;
  moveInTimeframe: string;
  meetingRoomsNeeded: boolean;
  gstRequired: boolean;
  parkingNeeded: boolean;
  powerBackupRequired: boolean;
  nearMetroPreferred: boolean;
  notes?: string;
  sourcePage: string;
  listingSlug?: string;
  createdAt: string;
  status: LeadStatus;
  owner?: string;
  isUrgent: boolean;
}

export type LeadStatus = 
  | "new"
  | "qualifying"
  | "shortlist_sent"
  | "visit_requested"
  | "visit_scheduled"
  | "quote_sent"
  | "booked"
  | "lost";

export const leadStatusLabels: Record<LeadStatus, string> = {
  new: "New",
  qualifying: "Qualifying",
  shortlist_sent: "Shortlist Sent",
  visit_requested: "Visit Requested",
  visit_scheduled: "Visit Scheduled",
  quote_sent: "Quote Sent",
  booked: "Booked",
  lost: "Lost",
};

export interface Visit {
  id: string;
  leadId: string;
  leadName: string;
  listingSlugs: string[];
  preferredSlots: string[];
  visitorCount: number;
  status: "pending" | "confirmed" | "rescheduled" | "completed" | "cancelled";
  confirmedSlot?: string;
  notes?: string;
  createdAt: string;
}
