import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState, useEffect } from "react";

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
}

export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
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
    queryFn: () => api.auth.getPartnerMe(token!),
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
    queryFn: () => api.auth.getAdminMe(token!),
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
    queryFn: () => api.admin.getPartners(token!, params),
    enabled: !!token && userType === "admin",
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useUpdatePartnerStatus() {
  const queryClient = useQueryClient();
  const token = getStoredToken();
  
  return useMutation({
    mutationFn: ({ partnerId, data }: {
      partnerId: string;
      data: { status: string; notes?: string };
    }) => api.admin.updatePartnerStatus(token!, partnerId, data),
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
    queryFn: () => api.admin.getListings(token!, params),
    enabled: !!token && userType === "admin",
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useAdminListing(listingId: string) {
  const token = getStoredToken();
  const userType = getStoredUserType();
  
  return useQuery({
    queryKey: ["admin", "listing", listingId],
    queryFn: () => api.admin.getListing(token!, listingId),
    enabled: !!token && userType === "admin" && !!listingId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useApproveListing() {
  const queryClient = useQueryClient();
  const token = getStoredToken();
  
  return useMutation({
    mutationFn: ({ listingId, notes }: { listingId: string; notes?: string }) => 
      api.admin.approveListing(token!, listingId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "listing"] });
    },
  });
}

export function useNeedsInfoListing() {
  const queryClient = useQueryClient();
  const token = getStoredToken();
  
  return useMutation({
    mutationFn: ({ listingId, notes }: { listingId: string; notes: string }) => 
      api.admin.needsInfoListing(token!, listingId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "listing"] });
    },
  });
}

export function useRejectListing() {
  const queryClient = useQueryClient();
  const token = getStoredToken();
  
  return useMutation({
    mutationFn: ({ listingId, reason }: { listingId: string; reason: string }) => 
      api.admin.rejectListing(token!, listingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "listing"] });
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
      const result = await api.partner.getListings(token!, params);
      console.log("Partner listings result:", result);
      return result;
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
    queryFn: () => api.partner.getListing(token!, listingId),
    enabled: !!token && userType === "partner" && !!listingId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
}

export function useCreatePartnerListing() {
  const queryClient = useQueryClient();
  const token = getStoredToken();
  
  return useMutation({
    mutationFn: (data: any) => api.partner.createListing(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "listings"] });
    },
  });
}

export function useUpdatePartnerListing() {
  const queryClient = useQueryClient();
  const token = getStoredToken();
  
  return useMutation({
    mutationFn: ({ listingId, data }: { listingId: string; data: any }) => 
      api.partner.updateListing(token!, listingId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner", "listings"] });
      queryClient.invalidateQueries({ queryKey: ["partner", "listing"] });
    },
  });
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