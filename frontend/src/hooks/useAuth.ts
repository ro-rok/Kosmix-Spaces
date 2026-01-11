import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, setAuthToken } from "@/lib/api";
import { useState, useEffect } from "react";
import { PartnerStatus, LeadStatus, VisitStatus } from "@/types/models";

// Auth storage helpers
const TOKEN_KEY = "kosmix_auth_token";
const USER_TYPE_KEY = "kosmix_user_type";

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUserType(): "partner" | "admin" | null {
  return localStorage.getItem(USER_TYPE_KEY) as "partner" | "admin" | null;
}

export function setAuthData(token: string, userType: "partner" | "admin") {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_TYPE_KEY, userType);
  setAuthToken(token); // Update API client token
}

export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
  setAuthToken(null); // Clear API client token
}

// Initialize auth token on module load
const storedToken = getStoredToken();
if (storedToken) {
  setAuthToken(storedToken);
}

// Partner authentication hooks
export function usePartnerRegister() {
  return useMutation({
    mutationFn: api.auth.registerPartner,
  });
}

export function usePartnerLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.auth.loginPartner,
    onSuccess: (data) => {
      setAuthData(data.accessToken, "partner");
      queryClient.invalidateQueries({ queryKey: ["partner", "me"] });
    },
  });
}

export function usePartnerMe() {
  const token = getStoredToken();
  const userType = getStoredUserType();
  
  return useQuery({
    queryKey: ["partner", "me"],
    queryFn: () => api.auth.getPartnerMe(),
    enabled: !!token && userType === "partner",
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Admin authentication hooks
export function useAdminLogin() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.auth.loginAdmin,
    onSuccess: (data) => {
      setAuthData(data.accessToken, "admin");
      queryClient.invalidateQueries({ queryKey: ["admin", "me"] });
    },
  });
}

export function useAdminMe() {
  const token = getStoredToken();
  const userType = getStoredUserType();
  
  return useQuery({
    queryKey: ["admin", "me"],
    queryFn: () => api.auth.getAdminMe(),
    enabled: !!token && userType === "admin",
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Admin partner management hooks
export function useAdminPartners(params: {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const token = getStoredToken();
  const userType = getStoredUserType();
  
  return useQuery({
    queryKey: ["admin", "partners", params],
    queryFn: () => api.admin.getPartners(params),
    enabled: !!token && userType === "admin",
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUpdatePartnerStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ partnerId, data }: {
      partnerId: string;
      data: { status: PartnerStatus; notes?: string };
    }) => api.admin.updatePartnerStatus(partnerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "partners"] });
    },
  });
}

// Admin listing hooks
export function useAdminListings(params: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const token = getStoredToken();
  const userType = getStoredUserType();
  
  return useQuery({
    queryKey: ["admin", "listings", params],
    queryFn: () => api.admin.getListings(params),
    enabled: !!token && userType === "admin",
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAdminListing(listingId: string) {
  const token = getStoredToken();
  const userType = getStoredUserType();
  
  return useQuery({
    queryKey: ["admin", "premium-listing", listingId],
    queryFn: () => api.admin.getPremiumListing(listingId),
    enabled: !!token && userType === "admin" && !!listingId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useApproveListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ listingId, notes }: { listingId: string; notes?: string }) => 
      api.admin.approvePremiumListing(listingId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listing"] });
    },
  });
}

export function useNeedsInfoListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ listingId, notes }: { listingId: string; notes: string }) => 
      api.admin.needsInfoPremiumListing(listingId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listing"] });
    },
  });
}

export function useRejectListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ listingId, reason }: { listingId: string; reason: string }) => 
      api.admin.rejectPremiumListing(listingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listing"] });
    },
  });
}

// Admin premium listing hooks
export function useAdminPremiumListings(params: {
  status?: string;
  page?: number;
  pageSize?: number;
} = {}) {
  const token = getStoredToken();
  const userType = getStoredUserType();
  
  return useQuery({
    queryKey: ["admin", "premium-listings", params],
    queryFn: () => api.admin.getPremiumListings(params),
    enabled: !!token && userType === "admin",
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAdminPremiumListing(listingId: string) {
  const token = getStoredToken();
  const userType = getStoredUserType();
  
  return useQuery({
    queryKey: ["admin", "premium-listing", listingId],
    queryFn: () => api.admin.getPremiumListing(listingId),
    enabled: !!token && userType === "admin" && !!listingId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useApprovePremiumListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ listingId, notes }: { listingId: string; notes?: string }) => 
      api.admin.approvePremiumListing(listingId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listing"] });
    },
  });
}

export function useNeedsInfoPremiumListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ listingId, notes }: { listingId: string; notes: string }) => 
      api.admin.needsInfoPremiumListing(listingId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listing"] });
    },
  });
}

export function useRejectPremiumListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ listingId, reason }: { listingId: string; reason: string }) => 
      api.admin.rejectPremiumListing(listingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "premium-listing"] });
    },
  });
}

// Partner listing hooks
export function usePartnerListings(params: {
  page?: number;
  pageSize?: number;
} = {}) {
  const token = getStoredToken();
  const userType = getStoredUserType();
  
  return useQuery({
    queryKey: ["partner", "listings", params],
    queryFn: async () => {
      console.log("Fetching partner listings with token:", !!token);
      const result = await api.partner.getListings(params);
      console.log("Partner listings result:", result);
      
      // Handle both paginated response (premium) and direct array (legacy)
      if (Array.isArray(result)) {
        return result; // Legacy format
      } else if (result && Array.isArray(result.items)) {
        return result.items; // Premium paginated format
      } else {
        return []; // Fallback
      }
    },
    enabled: !!token && userType === "partner",
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function usePartnerListing(listingId: string) {
  const token = getStoredToken();
  const userType = getStoredUserType();
  
  return useQuery({
    queryKey: ["partner", "listing", listingId],
    queryFn: () => api.partner.getListing(listingId),
    enabled: !!token && userType === "partner" && !!listingId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreatePartnerListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => api.partner.createListing(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "listings"] });
    },
  });
}

export function useUpdatePartnerListing() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ listingId, data }: { listingId: string; data: any }) => 
      api.partner.updateListing(listingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["partner", "listing"] });
    },
  });
}

// Partner photo management hooks
export function useUploadPhoto() {
  return useMutation({
    mutationFn: ({ file, offeringType }: { file: File; offeringType?: string }) => 
      api.partner.uploadPhoto(file, offeringType || "hero"),
  });
}

export function useDeletePhoto() {
  return useMutation({
    mutationFn: (publicId: string) => 
      api.partner.deletePhoto(publicId),
  });
}
}

// Logout hook
export function useLogout() {
  const queryClient = useQueryClient();
  
  return () => {
    clearAuthData();
    queryClient.clear();
    window.location.href = "/";
  };
}

// Auth status hook
export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userType, setUserType] = useState<"partner" | "admin" | null>(null);
  
  useEffect(() => {
    const token = getStoredToken();
    const type = getStoredUserType();
    setIsAuthenticated(!!token);
    setUserType(type);
  }, []);
  
  return { isAuthenticated, userType };
}