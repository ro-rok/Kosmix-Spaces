import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingAnimation } from "@/components/LoadingAnimation";
import { useEffect } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading, userRole, isSessionExpired, refreshSession } = useAuth();
  
  // Handle session expiry
  useEffect(() => {
    if (isSessionExpired) {
      // Context will handle redirect to login
      return;
    }
  }, [isSessionExpired]);

  // If loading, show loading state
  if (isLoading) {
    return <PageLoadingAnimation text="Verifying authentication..." />;
  }

  // If not authenticated or wrong user type, redirect to login
  if (!isAuthenticated || userRole !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }
  
  // If no user data after loading, redirect to login
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}