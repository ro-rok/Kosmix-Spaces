import { listings } from "@/data/listings";
import { AdminListing, Lead, Visit, LeadStatus, AdminVerificationStatus } from "./types";

// Convert listings to admin listings with mock data
export const mockAdminListings: AdminListing[] = listings.map((listing, idx) => ({
  ...listing,
  adminStatus: (
    listing.verificationStatus === "verified" ? "approved" :
    listing.verificationStatus === "pending" ? "pending" : "pending"
  ) as AdminVerificationStatus,
  verificationChecklist: {
    partnerContactVerified: listing.verificationStatus === "verified",
    photosVerified: listing.verificationStatus === "verified",
    specsVerified: listing.verificationStatus === "verified",
    pricingStructureConfirmed: listing.verificationStatus === "verified",
    addressHidingConfirmed: listing.verificationStatus === "verified",
  },
  auditTrail: listing.verificationStatus === "verified" ? [
    {
      id: `audit-${idx}-1`,
      action: "Created",
      user: "Partner",
      timestamp: listing.createdAt,
    },
    {
      id: `audit-${idx}-2`,
      action: "Approved",
      user: "Admin",
      timestamp: new Date(new Date(listing.createdAt).getTime() + 86400000).toISOString().split("T")[0],
      notes: "All verification checks passed",
    },
  ] : [
    {
      id: `audit-${idx}-1`,
      action: "Created",
      user: "Partner",
      timestamp: listing.createdAt,
    },
  ],
}));

// Mock leads data
export const mockLeads: Lead[] = [
  {
    id: "lead-1",
    name: "Rahul Sharma",
    phone: "+91 98765 43210",
    email: "rahul@example.com",
    company: "TechStart Solutions",
    localityPrefs: ["connaught-place", "saket"],
    teamSizeBand: "6-15",
    budgetBand: "20k-40k",
    spaceType: "private-cabin",
    moveInTimeframe: "This month",
    meetingRoomsNeeded: true,
    gstRequired: true,
    parkingNeeded: true,
    powerBackupRequired: true,
    nearMetroPreferred: true,
    notes: "Looking for a modern space with good connectivity",
    sourcePage: "homepage",
    createdAt: "2024-03-20T10:30:00Z",
    status: "new",
    isUrgent: true,
  },
  {
    id: "lead-2",
    name: "Priya Kapoor",
    phone: "+91 87654 32109",
    company: "Design Studio Delhi",
    localityPrefs: ["hauz-khas"],
    teamSizeBand: "1-5",
    budgetBand: "10k-20k",
    spaceType: "dedicated-desk",
    moveInTimeframe: "Next month",
    meetingRoomsNeeded: false,
    gstRequired: true,
    parkingNeeded: false,
    powerBackupRequired: true,
    nearMetroPreferred: true,
    sourcePage: "explore",
    createdAt: "2024-03-19T14:00:00Z",
    status: "qualifying",
    owner: "Team A",
    isUrgent: false,
  },
  {
    id: "lead-3",
    name: "Amit Verma",
    phone: "+91 76543 21098",
    email: "amit.v@enterprise.co",
    company: "Enterprise Corp",
    localityPrefs: ["dwarka"],
    teamSizeBand: "50+",
    budgetBand: "80k+",
    spaceType: "managed-office",
    moveInTimeframe: "Within 3 months",
    meetingRoomsNeeded: true,
    gstRequired: true,
    parkingNeeded: true,
    powerBackupRequired: true,
    nearMetroPreferred: true,
    notes: "Need space for 80+ employees with expansion room",
    sourcePage: "listing-detail",
    listingSlug: "enterprise-office-dwarka",
    createdAt: "2024-03-18T09:15:00Z",
    status: "shortlist_sent",
    owner: "Team B",
    isUrgent: true,
  },
  {
    id: "lead-4",
    name: "Sneha Gupta",
    phone: "+91 65432 10987",
    localityPrefs: ["greater-kailash", "south-extension"],
    teamSizeBand: "16-30",
    budgetBand: "40k-80k",
    spaceType: "private-cabin",
    moveInTimeframe: "Flexible",
    meetingRoomsNeeded: true,
    gstRequired: true,
    parkingNeeded: true,
    powerBackupRequired: true,
    nearMetroPreferred: false,
    sourcePage: "contact",
    createdAt: "2024-03-17T16:45:00Z",
    status: "visit_scheduled",
    owner: "Team A",
    isUrgent: false,
  },
  {
    id: "lead-5",
    name: "Vikram Singh",
    phone: "+91 54321 09876",
    company: "Startup Ventures",
    localityPrefs: ["okhla", "nehru-place"],
    teamSizeBand: "6-15",
    budgetBand: "10k-20k",
    spaceType: "dedicated-desk",
    moveInTimeframe: "This week",
    meetingRoomsNeeded: false,
    gstRequired: false,
    parkingNeeded: false,
    powerBackupRequired: true,
    nearMetroPreferred: true,
    notes: "Urgent requirement",
    sourcePage: "homepage",
    createdAt: "2024-03-21T08:00:00Z",
    status: "new",
    isUrgent: true,
  },
];

// Mock visits data
export const mockVisits: Visit[] = [
  {
    id: "visit-1",
    leadId: "lead-4",
    leadName: "Sneha Gupta",
    listingSlugs: ["premium-cabin-greater-kailash", "executive-suite-south-extension"],
    preferredSlots: ["2024-03-25 Morning", "2024-03-26 Afternoon"],
    visitorCount: 3,
    status: "confirmed",
    confirmedSlot: "2024-03-25 Morning",
    createdAt: "2024-03-20T10:00:00Z",
  },
  {
    id: "visit-2",
    leadId: "lead-3",
    leadName: "Amit Verma",
    listingSlugs: ["enterprise-office-dwarka"],
    preferredSlots: ["2024-03-27 Morning", "2024-03-28 Morning", "2024-03-29 Afternoon"],
    visitorCount: 5,
    status: "pending",
    createdAt: "2024-03-21T09:00:00Z",
  },
  {
    id: "visit-3",
    leadId: "lead-2",
    leadName: "Priya Kapoor",
    listingSlugs: ["creative-studio-hauz-khas"],
    preferredSlots: ["2024-03-24 Afternoon"],
    visitorCount: 1,
    status: "completed",
    confirmedSlot: "2024-03-24 Afternoon",
    notes: "Liked the space, waiting for quote",
    createdAt: "2024-03-19T15:00:00Z",
  },
];

// Helper to get lead counts by status
export function getLeadCountsByStatus(): Record<LeadStatus, number> {
  const counts: Record<LeadStatus, number> = {
    new: 0,
    qualifying: 0,
    shortlist_sent: 0,
    visit_requested: 0,
    visit_scheduled: 0,
    quote_sent: 0,
    booked: 0,
    lost: 0,
  };
  mockLeads.forEach((lead) => {
    counts[lead.status]++;
  });
  return counts;
}
