import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, setAuthToken } from '@/lib/api';
import { PartnerStatus } from '@/types/models';

// Auth storage helpers
const TOKEN_KEY = "kosmix_auth_token";
const USER_TYPE_KEY = "kosmix_user_type";

export type UserRole = 'partner' | 'admin' | null;

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  // Partner-specific fields
  workspaceBrandName?: string;
  contactName?: string;
  phone?: string;
  status?: PartnerStatus;
  // Admin-specific fields
  adminRole?: string;
}

export interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userRole: UserRole;
  login: (token: string, userType: UserRole) => void;
  logout: () => void;
  refreshSession: () => Promise<void>;
  isSessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Storage helpers
function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getStoredUserType(): UserRole {
  return localStorage.getItem(USER_TYPE_KEY) as UserRole;
}

function setAuthData(token: string, userType: UserRole) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_TYPE_KEY, userType || '');
  setAuthToken(token);
}

function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_TYPE_KEY);
  setAuthToken(null);
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [isSessionExpired, setIsSessionExpired] = useState(false);
  const queryClient = useQueryClient();
  
  // Initialize auth state from localStorage
  const storedToken = getStoredToken();
  const storedUserType = getStoredUserType();
  
  // Set initial token in API client
  useEffect(() => {
    if (storedToken) {
      setAuthToken(storedToken);
    }
  }, [storedToken]);

  // Session hydration queries
  const partnerQuery = useQuery({
    queryKey: ['auth', 'partner'],
    queryFn: async () => {
      const data = await api.auth.getPartnerMe();
      return {
        id: data.partnerId,
        email: data.email,
        role: 'partner' as const,
        workspaceBrandName: data.workspaceBrandName,
        contactName: data.contactName,
        phone: data.phone,
        status: data.status,
      };
    },
    enabled: !!storedToken && storedUserType === 'partner',
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error: any) => {
      console.error('Partner session validation failed:', error);
      if (error.status === 401) {
        setIsSessionExpired(true);
        handleSessionExpiry();
      }
    },
  });

  const adminQuery = useQuery({
    queryKey: ['auth', 'admin'],
    queryFn: async () => {
      const data = await api.auth.getAdminMe();
      return {
        id: data.adminId,
        email: data.email,
        role: 'admin' as const,
        adminRole: data.role,
      };
    },
    enabled: !!storedToken && storedUserType === 'admin',
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
    onError: (error: any) => {
      console.error('Admin session validation failed:', error);
      if (error.status === 401) {
        setIsSessionExpired(true);
        handleSessionExpiry();
      }
    },
  });

  // Determine current user and loading state
  const currentQuery = storedUserType === 'partner' ? partnerQuery : 
                      storedUserType === 'admin' ? adminQuery : null;
  
  const user = currentQuery?.data || null;
  const isLoading = currentQuery?.isLoading || false;
  const isAuthenticated = !!user && !!storedToken;
  const userRole = user?.role || null;

  // Handle session expiry
  const handleSessionExpiry = () => {
    clearAuthData();
    queryClient.clear();
    setIsSessionExpired(true);
    
    // Redirect to appropriate login page based on current path
    const currentPath = window.location.pathname;
    if (currentPath.startsWith('/admin')) {
      window.location.href = '/admin/login';
    } else if (currentPath.startsWith('/partner')) {
      window.location.href = '/partner/login';
    }
  };

  // Login function
  const login = (token: string, userType: UserRole) => {
    setAuthData(token, userType);
    setIsSessionExpired(false);
    
    // Invalidate and refetch auth queries
    queryClient.invalidateQueries({ queryKey: ['auth'] });
  };

  // Logout function
  const logout = () => {
    clearAuthData();
    queryClient.clear();
    setIsSessionExpired(false);
    window.location.href = '/';
  };

  // Refresh session function
  const refreshSession = async () => {
    if (!storedToken || !storedUserType) {
      throw new Error('No active session to refresh');
    }
    
    try {
      await queryClient.invalidateQueries({ queryKey: ['auth'] });
      await currentQuery?.refetch();
      setIsSessionExpired(false);
    } catch (error) {
      console.error('Session refresh failed:', error);
      handleSessionExpiry();
      throw error;
    }
  };

  // Monitor for token changes in other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === TOKEN_KEY) {
        if (!e.newValue) {
          // Token was removed in another tab
          logout();
        } else if (e.newValue !== storedToken) {
          // Token was changed in another tab
          window.location.reload();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storedToken]);

  // Auto-refresh session periodically
  useEffect(() => {
    if (!isAuthenticated) return;

    const refreshInterval = setInterval(() => {
      refreshSession().catch(() => {
        // Session refresh failed, will be handled by error handlers
      });
    }, 1000 * 60 * 10); // Refresh every 10 minutes

    return () => clearInterval(refreshInterval);
  }, [isAuthenticated]);

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    userRole,
    login,
    logout,
    refreshSession,
    isSessionExpired,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}