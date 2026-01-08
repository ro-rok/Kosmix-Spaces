import { VerificationStatus } from "@/types/models";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: VerificationStatus;
  className?: string;
}

const statusConfig: Record<VerificationStatus, { label: string; icon: typeof Clock; className: string }> = {
  pending: {
    label: "Pending Review",
    icon: Clock,
    className: "bg-accent/20 text-accent-foreground",
  },
  "needs-info": {
    label: "Needs Info",
    icon: AlertCircle,
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
  },
  "approved-verified": {
    label: "Approved",
    icon: CheckCircle,
    className: "bg-success/10 text-success",
  },
  rejected: {
    label: "Rejected",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
  },
  verified: {
    label: "Verified",
    icon: CheckCircle,
    className: "bg-success/10 text-success",
  },
  unverified: {
    label: "Unverified",
    icon: AlertCircle,
    className: "bg-muted text-muted-foreground",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
        config.className,
        className
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}
