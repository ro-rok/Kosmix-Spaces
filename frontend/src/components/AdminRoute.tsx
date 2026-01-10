import { Navigate } from "react-router-dom";
import { useAdminMe, getStoredToken, getStoredUserType, clearAuthData } from "@/hooks/useAuth";
import { useEffect } from "react";

interface AdminRouteProps {
  children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
  const token = getStoredToken();
  const userType = getStoredUserType();
  const { data: adminData, isLoading, error } = useAdminMe();
  
  // Clear auth data on authentication error
  useEffect(() => {
    if (error && token) {
      console.log("Admin authentication failed, clearing auth data");
      clearAuthData();
    }
  }, [error, token]);
  
  // If no token or wrong user type, redirect to login
  if (!token || userType !== "admin") {
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
  
  // If error or no admin data, redirect to login
  if (error || !adminData) {
    return <Navigate to="/admin/login" replace />;
  }
  
  return <>{children}</>;
}