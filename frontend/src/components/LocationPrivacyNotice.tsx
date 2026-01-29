/**
 * LocationPrivacyNotice - Component for displaying location privacy information
 * Shows clear messaging about when exact address is shared
 */

import React from 'react';
import { MapPin, Shield, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LocationPrivacyNoticeProps {
  /** Variant: inline (for listing pages) or card (for enquiry confirmation) */
  variant?: 'inline' | 'card';
  /** Additional className */
  className?: string;
  /** Show icon */
  showIcon?: boolean;
}

/**
 * LocationPrivacyNotice component
 * 
 * Displays clear messaging about location privacy:
 * - Exact address is NOT shown publicly
 * - Exact address is shared after enquiry confirmation
 */
export function LocationPrivacyNotice({
  variant = 'inline',
  className,
  showIcon = true
}: LocationPrivacyNoticeProps) {
  const message = "Exact location shared by partner after enquiry is confirmed";
  
  if (variant === 'card') {
    return (
      <div className={cn(
        "rounded-lg border border-primary/20 bg-primary/5 p-4",
        className
      )}>
        <div className="flex items-start gap-3">
          {showIcon && (
            <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              Location Privacy
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {message}
            </p>
          </div>
        </div>
      </div>
    );
  }
  
  // Inline variant (default)
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-muted-foreground",
      className
    )}>
      {showIcon && (
        <MapPin className="h-4 w-4 shrink-0" />
      )}
      <span>
        <span className="font-medium text-foreground">Note:</span> {message}
      </span>
    </div>
  );
}

/**
 * Simplified inline notice (just text)
 */
export function LocationPrivacyText({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      <Info className="h-3 w-3 inline mr-1" />
      Exact location shared after enquiry confirmation
    </p>
  );
}
