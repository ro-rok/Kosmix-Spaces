import { VerificationStatus } from "@/types/models";
import { cn } from "@/lib/utils";
import { Clock, AlertCircle, CheckCircle, XCircle } from "lucide-react";

interface StatusBadgeProps {
  status: string; // Changed from VerificationStatus to string to handle backend format
  className?: string;
}

const statusConfig: Record<string, { label: string; icon: typeof Clock; className: string }> = {
  // Frontend format (lowercase with hyphens)
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
  // Backend format (uppercase with underscores)
  "PENDING_REVIEW": {
    label: "Pending Review",
    icon: Clock,
    className: "bg-accent/20 text-accent-foreground",
  },
  "NEEDS_INFO": {
    label: "Needs Info",
    icon: AlertCircle,
    className: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-500",
  },
  "APPROVED_VERIFIED": {
    label: "Approved",
    icon: CheckCircle,
    className: "bg-success/10 text-success",
  },
  "REJECTED": {
    label: "Rejected",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
  },
  "SUSPENDED": {
    label: "Suspended",
    icon: XCircle,
    className: "bg-destructive/10 text-destructive",
  },
  "SUBMITTED": {
    label: "Submitted for Review",
    icon: Clock,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-500",
  },
  "PENDING": {
    label: "Pending",
    icon: Clock,
    className: "bg-accent/20 text-accent-foreground",
  },
  "APPROVED": {
    label: "Approved",
    icon: CheckCircle,
    className: "bg-success/10 text-success",
  },
  approved: {
    label: "Approved",
    icon: CheckCircle,
    className: "bg-success/10 text-success",
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  // Safety check - if status is not recognized, use a default
  if (!config) {
    console.warn(`Unknown status: ${status}. Using default 'pending' status.`);
    const defaultConfig = statusConfig.pending;
    const Icon = defaultConfig.icon;
    
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          defaultConfig.className,
          className
        )}
      >
        <Icon className="h-3.5 w-3.5" />
        {status} {/* Show the actual status for debugging */}
      </span>
    );
  }
  
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
