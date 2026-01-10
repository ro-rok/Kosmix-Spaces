import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
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

  // If not authenticated or wrong user type, redirect to login
  if (!isAuthenticated || userRole !== "admin") {
    return <Navigate to="/admin/login" replace />;
  }
  
  // If loading, show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Verifying authentication...</p>
        </div>
      </div>
    );
  }
  
  // If no user data after loading, redirect to login
  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}