import { Navigate } from "react-router-dom";
import { getStoredToken, getStoredUserType } from "@/hooks/useAuth";

interface PartnerRouteProps {
  children: React.ReactNode;
}

export function PartnerRoute({ children }: PartnerRouteProps) {
  const token = getStoredToken();
  const userType = getStoredUserType();

  if (!token || userType !== "partner") {
    return <Navigate to="/partner/login" replace />;
  }

  return <>{children}</>;
}
