import { Listing, PartnerStatus, LeadStatus, VisitStatus } from "@/types/models";
import { performanceCache } from "@/lib/performance";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

// Enhanced API Error class with structured error information
export class ApiError extends Error {
  constructor(
    public status: number, 
    message: string, 
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Auth token management
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken || localStorage.getItem("kosmix_auth_token");
}

// Enhanced API client with automatic auth injection, error normalization, and caching
async function apiRequest<T>(
  endpoint: string, 
  options: RequestInit = {},
  cacheKey?: string,
  cacheTTL?: number
): Promise<T> {
  // Check cache first for GET requests
  if (cacheKey && (!options.method || options.method === 'GET')) {
    const cached = performanceCache.get(cacheKey) as T | null;
    if (cached) {
      return cached;
    }
  }

  const url = `${API_BASE_URL}/api${endpoint}`;
  
  // Prepare headers with automatic auth injection
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
  };

  // Only set Content-Type if not explicitly overridden and not FormData
  if (!headers.hasOwnProperty("Content-Type") && !(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  // Auto-inject Bearer token for authenticated requests
  const token = getAuthToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  const requestOptions: RequestInit = {
    ...options,
    headers,
  };
  
  try {
    const response = await fetch(url, requestOptions);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      // Log detailed error information for debugging
      console.error("API Error Response:", {
        status: response.status,
        statusText: response.statusText,
        url,
        errorData
      });
      
      // Normalize error response structure
      const error = errorData.error || errorData;
      let errorMessage = error?.message || `HTTP ${response.status}: ${response.statusText}`;
      let errorCode = error?.code;
      let errorDetails = error?.details;
      
      // Handle validation errors (422)
      if (response.status === 422 && error?.details?.errors) {
        console.error("Validation errors:", error.details.errors);
        errorMessage = `Validation failed: ${error.details.errors.map((e: any) => `${e.loc?.join('.')} - ${e.msg}`).join(', ')}`;
        errorCode = "VALIDATION_ERROR";
        errorDetails = error.details.errors;
      }
      
      // Handle authentication errors (401)
      if (response.status === 401) {
        errorCode = "UNAUTHORIZED";
        errorMessage = "Authentication required or session expired";
        // Clear invalid token
        localStorage.removeItem("kosmix_auth_token");
        setAuthToken(null);
      }
      
      // Handle authorization errors (403)
      if (response.status === 403) {
        errorCode = "FORBIDDEN";
        errorMessage = "Access denied - insufficient permissions";
      }
      
      // Handle not found errors (404)
      if (response.status === 404) {
        errorCode = "NOT_FOUND";
        errorMessage = "Resource not found";
      }
      
      throw new ApiError(response.status, errorMessage, errorCode, errorDetails);
    }

    const data = await response.json();
    
    // Cache successful GET responses
    if (cacheKey && (!options.method || options.method === 'GET')) {
      performanceCache.set(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Network or other errors
    throw new ApiError(
      0,
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      "NETWORK_ERROR"
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
    verificationStatus: backendListing.verificationStatus || "PENDING_REVIEW",
    highlights: [], // Not provided by backend, could be derived from amenities
    overview: backendListing.overview,
    createdAt: backendListing.createdAt,
  };
}

// Enhanced API client with comprehensive endpoint mapping
export const api = {
  // Health check
  healthCheck: () => 
    apiRequest<{ status: string; message: string }>("/health", {}, "health-check", 30000),

  // Authentication endpoints
  auth: {
    // Partner authentication
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

    logoutPartner: () =>
      apiRequest<{ ok: boolean }>("/partner/auth/logout", {
        method: "POST",
      }),

    getPartnerMe: () =>
      apiRequest<{
        partnerId: string;
        workspaceBrandName: string;
        contactName: string;
        phone: string;
        email: string;
        status: PartnerStatus;
      }>("/partner/auth/me", {}, "partner-me", 60000),

    // Admin authentication
    loginAdmin: (data: { email: string; password: string }) =>
      apiRequest<{ accessToken: string; tokenType: string }>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    getAdminMe: () =>
      apiRequest<{
        adminId: string;
        email: string;
        role: string;
      }>("/admin/auth/me", {}, "admin-me", 60000),
  },

  // Public endpoints
  public: {
    // Localities - cache for 10 minutes
    getLocalities: () => 
      apiRequest<{
        by_city: Record<string, Array<{ id: string; name: string; popular: boolean; metroConnected?: boolean }>>;
        flat: Array<{ id: string; name: string; city: string; popular: boolean; metroConnected?: boolean }>;
      }>("/public/localities", {}, "localities", 600000),

    // Listings - cache based on params
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
      
      const cacheKey = `listings-${searchParams.toString()}`;
      
      return apiRequest<{
        items: any[];
        total: number;
        page: number;
        pageSize: number;
      }>(`/public/listings?${searchParams}`, {}, cacheKey, 300000).then(response => ({
        ...response,
        items: response.items.map(mapBackendListing)
      }));
    },

    getListingBySlug: (slug: string) =>
      apiRequest<any>(`/public/listings/${slug}`, {}, `listing-${slug}`, 300000).then(mapBackendListing),

    // Leads (Enquiries)
    createLead: (lead: {
      name: string;
      phone: string;
      email?: string;
      company?: string;
      preferredLocalities: string[];
      teamSizeBand: string;
      budgetBandId: string;
      spaceType: string;
      moveInTimeframe?: string;
      meetingRoomsNeeded?: boolean;
      gstRequired?: boolean;
      parkingNeeded?: boolean;
      powerBackupRequired?: boolean;
      nearMetroPreferred?: boolean;
      notes?: string;
      source?: string;
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
  },

  // Partner endpoints
  partner: {
    // Listings management
    getListings: (params: {
      page?: number;
      pageSize?: number;
    } = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      return apiRequest<Array<any>>(`/partner/listings?${searchParams}`);
    },

    getListing: (listingId: string) =>
      apiRequest<any>(`/partner/listings/${listingId}`),

    createListing: (data: any) =>
      apiRequest<any>("/partner/listings", {
        method: "POST",
        body: JSON.stringify(data),
      }),

    updateListing: (listingId: string, data: any) =>
      apiRequest<any>(`/partner/listings/${listingId}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),

    // Simple photo upload - uploads to Cloudinary, returns URL
    // Photo is NOT saved to database until listing is submitted
    uploadPhoto: (file: File, offeringType: string = "hero") => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('offering_type', offeringType);
      
      return apiRequest<{
        ok: boolean;
        photo: {
          url: string;
          publicId: string;
          width: number;
          height: number;
          bytes: number;
          format: string;
        };
      }>(`/partner/upload-photo`, {
        method: "POST",
        body: formData,
      });
    },

    // Delete photo from Cloudinary (before listing is submitted)
    deletePhoto: (publicId: string) =>
      apiRequest<{ ok: boolean; message: string }>(`/partner/delete-photo/${encodeURIComponent(publicId)}`, {
        method: "DELETE",
      }),
  },

  // Admin endpoints
  admin: {
    // Partner management
    getPartners: (params: {
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
          status: PartnerStatus;
        }>;
        total: number;
        page: number;
        pageSize: number;
      }>(`/admin/partners?${searchParams}`);
    },

    getPartner: (partnerId: string) =>
      apiRequest<{
        partnerId: string;
        workspaceBrandName: string;
        contactName: string;
        phone: string;
        email: string;
        status: PartnerStatus;
      }>(`/admin/partners/${partnerId}`),

    updatePartnerStatus: (partnerId: string, data: {
      status: PartnerStatus;
      notes?: string;
    }) =>
      apiRequest<{
        partnerId: string;
        workspaceBrandName: string;
        contactName: string;
        phone: string;
        email: string;
        status: PartnerStatus;
      }>(`/admin/partners/${partnerId}/status`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    deletePartner: (partnerId: string) =>
      apiRequest<{ message: string }>(`/admin/partners/${partnerId}`, {
        method: "DELETE",
      }),

    // Listing moderation
    getListings: (params: {
      status?: string;
      page?: number;
      pageSize?: number;
    } = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      return apiRequest<Array<any>>(`/admin/listings?${searchParams}`);
    },

    // Premium listing moderation
    getPremiumListings: (params: {
      status?: string;
      page?: number;
      pageSize?: number;
    } = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      return apiRequest<Array<any>>(`/admin/premium-listings?${searchParams}`);
    },

    getPremiumListing: (listingId: string) =>
      apiRequest<any>(`/admin/premium-listings/${listingId}`),

    approvePremiumListing: (listingId: string, notes?: string) =>
      apiRequest<{ ok: boolean; message: string }>(`/admin/premium-listings/${listingId}/approve`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),

    needsInfoPremiumListing: (listingId: string, notes: string) =>
      apiRequest<{ ok: boolean; message: string }>(`/admin/premium-listings/${listingId}/needs-info`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),

    rejectPremiumListing: (listingId: string, reason: string) =>
      apiRequest<{ ok: boolean; message: string }>(`/admin/premium-listings/${listingId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),

    getListing: (listingId: string) =>
      apiRequest<any>(`/admin/listings/${listingId}`),

    updateVerification: (listingId: string, data: {
      checks: {
        photosQuality?: boolean;
        contactVerified?: boolean;
        locationAccurate?: boolean;
      };
      notes?: string;
    }) =>
      apiRequest<{ ok: boolean }>(`/admin/listings/${listingId}/verification`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    approveListing: (listingId: string, notes?: string) =>
      apiRequest<{ ok: boolean; message: string }>(`/admin/listings/${listingId}/approve`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),

    needsInfoListing: (listingId: string, notes: string) =>
      apiRequest<{ ok: boolean; message: string }>(`/admin/listings/${listingId}/needs-info`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),

    rejectListing: (listingId: string, reason: string) =>
      apiRequest<{ ok: boolean; message: string }>(`/admin/listings/${listingId}/reject`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),

    // Lead management
    getLeads: (params: {
      status?: LeadStatus;
      locality?: string;
      page?: number;
      pageSize?: number;
    } = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      return apiRequest<Array<any>>(`/admin/leads?${searchParams}`);
    },

    updateLead: (leadId: string, data: {
      status?: LeadStatus;
      assignedTo?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH';
    }) =>
      apiRequest<any>(`/admin/leads/${leadId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),

    // Site visit management
    getSiteVisits: (params: {
      status?: VisitStatus;
      leadId?: string;
      page?: number;
      pageSize?: number;
    } = {}) => {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      return apiRequest<Array<any>>(`/admin/site-visits?${searchParams}`);
    },

    updateSiteVisit: (visitId: string, data: {
      status?: VisitStatus;
      confirmedSlot?: {
        date: string;
        timeSlot: string;
      };
      opsOwner?: string;
      partnerNotes?: string;
      customerNotes?: string;
    }) =>
      apiRequest<any>(`/admin/site-visits/${visitId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
  },

  // Analytics endpoints
  analytics: {
    // Track events in batch
    trackEvents: (events: Array<{
      eventId: string;
      eventName: string;
      timestamp: number;
      sessionId: string;
      userRole: 'anon' | 'partner' | 'admin';
      listingId?: string;
      listingSlug?: string;
      partnerId?: string;
      referrer?: string;
      path: string;
      metadata?: Record<string, any>;
    }>) =>
      apiRequest<{ success: boolean; eventsTracked: number; message: string }>("/analytics/events", {
        method: "POST",
        body: JSON.stringify({ events }),
      }),

    // Get admin analytics dashboard data
    getAdminAnalytics: (params?: {
      startDate?: string;
      endDate?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('start_date', params.startDate);
      if (params?.endDate) searchParams.append('end_date', params.endDate);
      
      const queryString = searchParams.toString();
      return apiRequest<{
        totalViews: number;
        totalEnquiries: number;
        totalSearches: number;
        partnerSignups: number;
        conversionRate: number;
        topLocalities: Array<{ locality: string; searches: number; views: number }>;
        topListings: Array<{ listingId: string; displayName: string; views: number; enquiries: number }>;
      }>(`/analytics/admin${queryString ? `?${queryString}` : ''}`);
    },

    // Get partner-specific analytics
    getPartnerAnalytics: (partnerId: string, params?: {
      startDate?: string;
      endDate?: string;
    }) => {
      const searchParams = new URLSearchParams();
      if (params?.startDate) searchParams.append('start_date', params.startDate);
      if (params?.endDate) searchParams.append('end_date', params.endDate);
      
      const queryString = searchParams.toString();
      return apiRequest<{
        views: number;
        enquiries: number;
        conversionRate: number;
        topListings: Array<{ listingId: string; displayName: string; views: number; enquiries: number }>;
      }>(`/analytics/partner/${partnerId}${queryString ? `?${queryString}` : ''}`);
    },
  },

  // Legacy compatibility - keep existing methods for backward compatibility
  getLocalities: () => api.public.getLocalities(),
  getListings: (params: any) => api.public.getListings(params),
  getListingDetail: (slug: string) => api.public.getListingBySlug(slug),
  createLead: (lead: any) => api.public.createLead(lead),
  createSiteVisit: (visit: any) => api.public.createSiteVisit(visit),
};