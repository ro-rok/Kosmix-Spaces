import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

interface PartnerRouteProps {
  children: React.ReactNode;
  requireApproved?: boolean;
}

export function PartnerRoute({ children, requireApproved = false }: PartnerRouteProps) {
  const { user, isAuthenticated, isLoading, userRole, isSessionExpired } = useAuth();

  // Handle session expiry
  useEffect(() => {
    if (isSessionExpired) {
      // Context will handle redirect to login
      return;
    }
  }, [isSessionExpired]);

  // If not authenticated or wrong user type, redirect to login
  if (!isAuthenticated || userRole !== "partner") {
    return <Navigate to="/partner/login" replace />;
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
    return <Navigate to="/partner/login" replace />;
  }

  // If partner approval is required and partner is not approved
  if (requireApproved && user.status !== "ACTIVE") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="mb-4">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold mb-2">Account Pending Approval</h2>
          <p className="text-muted-foreground mb-4">
            Your partner account is currently under review. You'll be able to create listings once approved by our team.
          </p>
          <p className="text-sm text-muted-foreground">
            Status: <span className="font-medium">{user.status}</span>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
