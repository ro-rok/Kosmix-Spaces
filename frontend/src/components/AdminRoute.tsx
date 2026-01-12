import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PageLoadingAnimation } from "@/components/LoadingAnimation";
import { useEffect } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const { user, isAuthenticated, isLoading, userRole, isSessionExpired, refreshSession } = useAuth();
  
  console.log("AdminRoute - Auth state:", {
    user,
    isAuthenticated,
    isLoading,
    userRole,
    isSessionExpired
  });
  
  // Handle session expiry
  useEffect(() => {
    if (isSessionExpired) {
      console.log("AdminRoute - Session expired, redirecting to login");
      // Context will handle redirect to login
      return;
    }
  }, [isSessionExpired]);

  // If loading, show loading state
  if (isLoading) {
    console.log("AdminRoute - Loading auth state");
    return <PageLoadingAnimation text="Verifying authentication..." />;
  }

  // If not authenticated or wrong user type, redirect to login
  if (!isAuthenticated || userRole !== "admin") {
    console.log("AdminRoute - Not authenticated or wrong role, redirecting to login");
    return <Navigate to="/admin/login" replace />;
  }
  
  // If no user data after loading, redirect to login
  if (!user) {
    console.log("AdminRoute - No user data, redirecting to login");
    return <Navigate to="/admin/login" replace />;
  }
  
  console.log("AdminRoute - Auth successful, rendering children");
  return <>{children}</>;
}