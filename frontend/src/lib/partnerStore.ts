import { PartnerAccount, PartnerSession, WorkspaceDraftListing } from "@/types/models";
import { getStorage, setStorage } from "./storage";

const STORAGE_VERSION = "v1";
const PARTNERS_KEY = "partners";
const SESSIONS_KEY = "partner_sessions";
const DRAFTS_KEY = "listing_drafts";

/**
 * Generate a unique partner ID
 */
function generatePartnerId(): string {
  return `partner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Generate a session token
 */
function generateToken(): string {
  return `token_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
}

/**
 * Get all partner accounts
 */
function getPartners(): PartnerAccount[] {
  return getStorage<PartnerAccount[]>(PARTNERS_KEY, STORAGE_VERSION) || [];
}

/**
 * Save all partner accounts
 */
function savePartners(partners: PartnerAccount[]): void {
  setStorage(PARTNERS_KEY, STORAGE_VERSION, partners);
}

/**
 * Get or create a partner account by email
 */
function getOrCreatePartner(
  email: string,
  workspaceBrandName?: string,
  contactName?: string,
  phone?: string
): PartnerAccount {
  const partners = getPartners();
  let partner = partners.find((p) => p.email === email);

  if (!partner) {
    partner = {
      partnerId: generatePartnerId(),
      workspaceBrandName: workspaceBrandName || "My Workspace",
      contactName: contactName || "",
      phone: phone || "",
      email,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    partners.push(partner);
    savePartners(partners);
  } else {
    // Update optional fields if provided
    if (workspaceBrandName) partner.workspaceBrandName = workspaceBrandName;
    if (contactName) partner.contactName = contactName;
    if (phone) partner.phone = phone;
    partner.updatedAt = new Date().toISOString();
    savePartners(partners);
  }

  return partner;
}

/**
 * Create a partner session
 */
export function createPartnerSession(
  email: string,
  workspaceBrandName?: string,
  contactName?: string,
  phone?: string
): PartnerSession {
  const partner = getOrCreatePartner(email, workspaceBrandName, contactName, phone);
  
  const session: PartnerSession = {
    partnerId: partner.partnerId,
    email: partner.email,
    token: generateToken(),
    createdAt: new Date().toISOString(),
  };

  const sessions = getStorage<PartnerSession[]>(SESSIONS_KEY, STORAGE_VERSION) || [];
  // Remove any existing session for this partner
  const filteredSessions = sessions.filter((s) => s.partnerId !== partner.partnerId);
  filteredSessions.push(session);
  setStorage(SESSIONS_KEY, STORAGE_VERSION, filteredSessions);

  return session;
}

/**
 * Get current partner session
 */
export function getPartnerSession(): PartnerSession | null {
  const sessions = getStorage<PartnerSession[]>(SESSIONS_KEY, STORAGE_VERSION) || [];
  if (sessions.length === 0) return null;
  
  // Return the most recent session (for demo, we'll use the last one)
  // In production, you'd validate the token
  return sessions[sessions.length - 1];
}

/**
 * Get partner account by ID
 */
export function getPartnerAccount(partnerId: string): PartnerAccount | null {
  const partners = getPartners();
  return partners.find((p) => p.partnerId === partnerId) || null;
}

/**
 * Logout - clear session
 */
export function logout(): void {
  const sessions = getStorage<PartnerSession[]>(SESSIONS_KEY, STORAGE_VERSION) || [];
  // For demo, clear all sessions. In production, clear only current session
  setStorage(SESSIONS_KEY, STORAGE_VERSION, []);
}

/**
 * Get all listings for a partner
 */
export function getPartnerListings(partnerId: string): WorkspaceDraftListing[] {
  const drafts = getStorage<WorkspaceDraftListing[]>(DRAFTS_KEY, STORAGE_VERSION) || [];
  return drafts.filter((d) => d.partnerId === partnerId);
}

/**
 * Submit a listing draft
 */
export function submitListingDraft(partnerId: string, draft: Omit<WorkspaceDraftListing, "draftId" | "partnerId" | "submittedAt" | "updatedAt" | "verificationStatus">): WorkspaceDraftListing {
  const drafts = getStorage<WorkspaceDraftListing[]>(DRAFTS_KEY, STORAGE_VERSION) || [];
  
  const draftId = `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  
  const fullDraft: WorkspaceDraftListing = {
    ...draft,
    draftId,
    partnerId,
    verificationStatus: "pending",
    submittedAt: now,
    updatedAt: now,
    auditTrail: [
      {
        id: `audit_${draftId}_1`,
        action: "Submitted",
        actorRole: "partner",
        timestamp: now,
      },
    ],
  };

  drafts.push(fullDraft);
  setStorage(DRAFTS_KEY, STORAGE_VERSION, drafts);

  return fullDraft;
}

/**
 * Update a listing draft (for resubmission)
 */
export function updateListingDraft(draftId: string, updates: Partial<WorkspaceDraftListing>): WorkspaceDraftListing | null {
  const drafts = getStorage<WorkspaceDraftListing[]>(DRAFTS_KEY, STORAGE_VERSION) || [];
  const index = drafts.findIndex((d) => d.draftId === draftId);
  
  if (index === -1) return null;

  const draft = drafts[index];
  const updatedDraft: WorkspaceDraftListing = {
    ...draft,
    ...updates,
    updatedAt: new Date().toISOString(),
    verificationStatus: updates.verificationStatus || "pending",
    auditTrail: [
      ...(draft.auditTrail || []),
      {
        id: `audit_${draftId}_${Date.now()}`,
        action: updates.verificationStatus === "pending" ? "Resubmitted" : "Updated",
        actorRole: "partner",
        timestamp: new Date().toISOString(),
        notes: updates.adminNotes ? `Updated: ${updates.adminNotes}` : undefined,
      },
    ],
  };

  drafts[index] = updatedDraft;
  setStorage(DRAFTS_KEY, STORAGE_VERSION, drafts);

  return updatedDraft;
}

/**
 * Get a draft by ID
 */
export function getDraftById(draftId: string): WorkspaceDraftListing | null {
  const drafts = getStorage<WorkspaceDraftListing[]>(DRAFTS_KEY, STORAGE_VERSION) || [];
  return drafts.find((d) => d.draftId === draftId) || null;
}
