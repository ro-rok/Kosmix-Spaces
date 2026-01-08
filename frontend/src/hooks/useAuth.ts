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