// Compatibility layer for components still using old auth hooks
// This provides the same interface as the old hooks but uses the new AuthContext

import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

// Legacy storage helpers - kept for backward compatibility
export function getStoredToken(): string | null {
  return localStorage.getItem("kosmix_auth_token");
}

export function getStoredUserType(): "partner" | "admin" | null {
  return localStorage.getItem("kosmix_user_type") as "partner" | "admin" | null;
}

export function setAuthData(token: string, userType: "partner" | "admin") {
  localStorage.setItem("kosmix_auth_token", token);
  localStorage.setItem("kosmix_user_type", userType);
}

export function clearAuthData() {
  localStorage.removeItem("kosmix_auth_token");
  localStorage.removeItem("kosmix_user_type");
}

// Legacy auth hooks that use the new AuthContext
export function usePartnerMe() {
  const { user, isLoading, userRole } = useAuth();
  
  return {
    data: userRole === 'partner' ? {
      partnerId: user?.id || '',
      workspaceBrandName: user?.workspaceBrandName || '',
      contactName: user?.contactName || '',
      phone: user?.phone || '',
      email: user?.email || '',
      status: user?.status || 'PENDING_REVIEW',
    } : null,
    isLoading,
    error: null,
  };
}

export function useAdminMe() {
  const { user, isLoading, userRole } = useAuth();
  
  return {
    data: userRole === 'admin' ? {
      adminId: user?.id || '',
      email: user?.email || '',
      role: user?.adminRole || 'admin',
    } : null,
    isLoading,
    error: null,
  };
}

export function usePartnerLogin() {
  const { login } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.auth.loginPartner,
    onSuccess: (data) => {
      login(data.accessToken, "partner");
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function usePartnerRegister() {
  return useMutation({
    mutationFn: api.auth.registerPartner,
  });
}

export function useAdminLogin() {
  const { login } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.auth.loginAdmin,
    onSuccess: (data) => {
      login(data.accessToken, "admin");
      queryClient.invalidateQueries({ queryKey: ["auth"] });
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();
  return logout;
}

export function useAuthStatus() {
  const { isAuthenticated, userRole } = useAuth();
  
  return {
    isAuthenticated,
    userType: userRole,
  };
}

// Main compatibility hook with redirectToLogin
export function useAuthCompat() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  
  const redirectToLogin = () => {
    logout();
    navigate('/partner/login');
  };
  
  return {
    redirectToLogin,
  };
}

// Re-export all the other hooks from the original useAuth for backward compatibility
export * from './useAuth';