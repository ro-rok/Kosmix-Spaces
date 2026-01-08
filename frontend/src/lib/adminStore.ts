import { WorkspaceDraftListing, VerificationStatus, AuditEntry } from "@/types/models";
import { Listing } from "@/types/models";
import { getStorage, setStorage } from "./storage";

const STORAGE_VERSION = "v1";
const DRAFTS_KEY = "listing_drafts";
const APPROVED_LISTINGS_KEY = "approved_listings";

/**
 * Get all partner-submitted drafts
 */
export function getAllDrafts(): WorkspaceDraftListing[] {
  return getStorage<WorkspaceDraftListing[]>(DRAFTS_KEY, STORAGE_VERSION) || [];
}

/**
 * Get drafts by status
 */
export function getDraftsByStatus(status: VerificationStatus): WorkspaceDraftListing[] {
  const drafts = getAllDrafts();
  return drafts.filter((d) => d.verificationStatus === status);
}

/**
 * Get a draft by ID
 */
export function getDraftById(draftId: string): WorkspaceDraftListing | null {
  const drafts = getAllDrafts();
  return drafts.find((d) => d.draftId === draftId) || null;
}

/**
 * Update draft status and admin notes
 */
export function updateDraftStatus(
  draftId: string,
  status: VerificationStatus,
  notes?: string,
  checks?: WorkspaceDraftListing["verificationChecklist"]
): WorkspaceDraftListing | null {
  const drafts = getAllDrafts();
  const index = drafts.findIndex((d) => d.draftId === draftId);

  if (index === -1) return null;

  const draft = drafts[index];
  const now = new Date().toISOString();

  const auditEntry: AuditEntry = {
    id: `audit_${draftId}_${Date.now()}`,
    action: status === "approved-verified" ? "Approved" : status === "rejected" ? "Rejected" : "Needs Info",
    actorRole: "admin",
    timestamp: now,
    notes,
  };

  const updatedDraft: WorkspaceDraftListing = {
    ...draft,
    verificationStatus: status,
    adminNotes: notes,
    updatedAt: now,
    verificationChecklist: checks || draft.verificationChecklist,
    auditTrail: [...(draft.auditTrail || []), auditEntry],
  };

  if (status === "rejected" && notes) {
    updatedDraft.rejectionReason = notes;
  }

  drafts[index] = updatedDraft;
  setStorage(DRAFTS_KEY, STORAGE_VERSION, drafts);

  return updatedDraft;
}

/**
 * Generate a slug from display name and locality
 */
function generateSlug(displayName: string, localityId: string): string {
  const base = `${displayName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${localityId}`;
  const timestamp = Date.now().toString(36);
  return `${base}-${timestamp}`.replace(/-+/g, "-").replace(/^-|-$/g, "");
}

/**
 * Convert draft to public listing format
 */
function draftToPublicListing(draft: WorkspaceDraftListing): Listing {
  return {
    slug: draft.slug || generateSlug(draft.displayName, draft.localityId),
    displayName: draft.displayName,
    locality: draft.locality,
    localityId: draft.localityId,
    city: draft.city,
    workspaceTypes: draft.workspaceTypes,
    photos: draft.photos,
    seatCapacityMin: draft.seatCapacityMin,
    seatCapacityMax: draft.seatCapacityMax,
    availabilityStatus: draft.availabilityStatus,
    budgetBand: draft.budgetBand,
    pricingMode: "on-enquiry",
    nearMetro: draft.nearMetro,
    metroNote: draft.metroNote,
    parking: draft.parking,
    powerBackup: draft.powerBackup,
    gstInvoiceAvailable: draft.gstInvoiceAvailable,
    accessHours: draft.accessHours,
    amenities: draft.amenities,
    meetingRoomsAddon: draft.meetingRoomsAddon || false,
    dealTags: draft.dealTags || [],
    verificationStatus: "approved-verified",
    highlights: draft.highlights || [],
    overview: draft.overview,
    createdAt: draft.submittedAt,
  };
}

/**
 * Approve a draft and convert it to a public listing
 */
export function approveDraftToPublicListing(draftId: string): Listing | null {
  const draft = getDraftById(draftId);
  if (!draft) return null;

  // Update draft status first
  const updatedDraft = updateDraftStatus(draftId, "approved-verified", "Listing approved and published", draft.verificationChecklist);
  if (!updatedDraft) return null;

  // Convert to public listing
  const publicListing = draftToPublicListing(updatedDraft);

  // Save to approved listings storage
  const approvedListings = getStorage<Listing[]>(APPROVED_LISTINGS_KEY, STORAGE_VERSION) || [];
  
  // Check if already exists (by slug)
  const existingIndex = approvedListings.findIndex((l) => l.slug === publicListing.slug);
  if (existingIndex !== -1) {
    approvedListings[existingIndex] = publicListing;
  } else {
    approvedListings.push(publicListing);
  }

  setStorage(APPROVED_LISTINGS_KEY, STORAGE_VERSION, approvedListings);

  return publicListing;
}

/**
 * Get all approved partner listings
 */
export function getApprovedPartnerListings(): Listing[] {
  return getStorage<Listing[]>(APPROVED_LISTINGS_KEY, STORAGE_VERSION) || [];
}
