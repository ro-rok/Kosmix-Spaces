import { Listing } from "@/types/models";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}/api${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        response.status,
        errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other errors
    throw new ApiError(
      0,
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// Helper function to map backend listing to frontend format
function mapBackendListing(backendListing: any): Listing {
  return {
    slug: backendListing.slug,
    displayName: backendListing.displayName,
    locality: backendListing.locality,
    localityId: backendListing.locality.toLowerCase().replace(/\s+/g, '-'),
    city: backendListing.city,
    workspaceTypes: backendListing.workspaceTypes,
    photos: backendListing.photos.map((photo: any) => photo.url),
    seatCapacityMin: backendListing.seatCapacityMin,
    seatCapacityMax: backendListing.seatCapacityMax,
    availabilityStatus: backendListing.availabilityStatus.toLowerCase(),
    budgetBand: backendListing.budgetBandId,
    pricingMode: "on-enquiry",
    nearMetro: backendListing.nearMetro,
    metroNote: backendListing.metroNote,
    parking: backendListing.parking !== "NONE",
    powerBackup: backendListing.powerBackup,
    gstInvoiceAvailable: backendListing.gstInvoiceAvailable,
    accessHours: backendListing.accessHours,
    amenities: backendListing.amenities,
    meetingRoomsAddon: backendListing.meetingRooms?.addonOnly || false,
    dealTags: backendListing.dealTags,
    verificationStatus: backendListing.isVerified ? "verified" : "pending",
    highlights: [], // Not provided by backend, could be derived from amenities
    overview: backendListing.overview,
    createdAt: backendListing.createdAt,
  };
}

// Public API endpoints
export const api = {
  // Health check
  healthCheck: () => 
    apiRequest<{ status: string; message: string }>("/health"),

  // Authentication
  auth: {
    // Partner auth
    registerPartner: (data: {
      workspaceBrandName: string;
      contactName: string;
      phone: string;
      email: string;
      password: string;
    }) =>
      apiRequest<{
        partnerId: string;
        workspaceBrandName: string;
        contactName: string;
        phone: string;
        email: string;
        status: string;
      }>("/partner/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    loginPartner: (data: { email: string; password: string }) =>
      apiRequest<{ accessToken: string; tokenType: string }>("/partner/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getPartnerMe: (token: string) =>
      apiRequest<{
        partnerId: string;
        workspaceBrandName: string;
        contactName: string;
        phone: string;
        email: string;
        status: string;
      }>("/partner/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),

    // Admin auth
    loginAdmin: (data: { email: string; password: string }) =>
      apiRequest<{ accessToken: string; tokenType: string }>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getAdminMe: (token: string) =>
      apiRequest<{
        adminId: string;
        email: string;
        role: string;
      }>("/admin/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
  },

  // Admin endpoints
  admin: {
    getPartners: (token: string, params: {
      status?: string;
      search?: string;
      page?: number;
      pageSize?: number;
    } = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      return apiRequest<{
        items: Array<{
          partnerId: string;
          workspaceBrandName: string;
          contactName: string;
          phone: string;
          email: string;
          status: string;
        }>;
        total: number;
        page: number;
        pageSize: number;
      }>(`/admin/partners?${searchParams}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },

    updatePartnerStatus: (token: string, partnerId: string, data: {
      status: string;
      notes?: string;
    }) =>
      apiRequest<{
        partnerId: string;
        workspaceBrandName: string;
        contactName: string;
        phone: string;
        email: string;
        status: string;
      }>(`/admin/partners/${partnerId}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      }),
  },

  // Localities
  getLocalities: () => 
    apiRequest<Array<{ id: string; name: string; city: string; popular: boolean }>>("/public/localities"),

  // Listings
  getListings: (params: {
    locality?: string;
    budgetBandId?: string;
    teamSizeBand?: string;
    spaceType?: string;
    nearMetro?: boolean;
    parking?: string;
    powerBackup?: boolean;
    gstInvoice?: boolean;
    sort?: "best_match" | "budget_low" | "recent_verified";
    page?: number;
    pageSize?: number;
  } = {}) => {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    
    return apiRequest<{
      items: any[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/public/listings?${searchParams}`).then(response => ({
      ...response,
      items: response.items.map(mapBackendListing)
    }));
  },

  getListingDetail: (slug: string) =>
    apiRequest<any>(`/public/listings/${slug}`).then(mapBackendListing),

  // Leads
  createLead: (lead: {
    name: string;
    phone: string;
    email?: string;
    company?: string;
    preferredLocalities: string[];
    teamSizeBand: string;
    budgetBandId: string;
    spaceType: string;
    moveInTimeframe: string;
    meetingRoomsNeeded: boolean;
    gstRequired: boolean;
    parkingNeeded: boolean;
    powerBackupRequired: boolean;
    nearMetroPreferred: boolean;
    notes?: string;
    source: string;
    listingSlug?: string;
  }) =>
    apiRequest<{
      leadId: string;
      message: string;
      whatsappDeepLink: string;
    }>("/public/leads", {
      method: "POST",
      body: JSON.stringify(lead),
    }),

  // Site visits
  createSiteVisit: (visit: {
    name: string;
    phone: string;
    email?: string;
    listingIds: string[];
    preferredSlots: Array<{
      date: string;
      timeSlot: string;
    }>;
    visitorCount: number;
  }) =>
    apiRequest<{
      visitRequestId: string;
      message: string;
    }>("/public/site-visits", {
      method: "POST",
      body: JSON.stringify(visit),
    }),
};

export { ApiError };