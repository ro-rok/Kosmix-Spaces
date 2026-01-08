import { Navigate } from "react-router-dom";
import { getPartnerSession } from "@/lib/partnerStore";

interface PartnerRouteProps {
  children: React.ReactNode;
}

export function PartnerRoute({ children }: PartnerRouteProps) {
  const session = getPartnerSession();

  if (!session) {
    return <Navigate to="/partner/login" replace />;
  }

  return <>{children}</>;
}
