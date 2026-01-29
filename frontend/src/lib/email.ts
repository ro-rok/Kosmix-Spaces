import { contactConfig } from "@/config/contact";
import { toast } from "sonner";
import { trackEmailClick } from "./analytics";

export function buildEmailLink(subject?: string): string {
  const subjectParam = subject ? `?subject=${encodeURIComponent(subject)}` : "";
  return `mailto:${contactConfig.email}${subjectParam}`;
}

export function copyEmailToClipboard(subject?: string): void {
  const email = contactConfig.email;
  
  // Check if clipboard API is available (desktop browsers)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(email).then(() => {
      toast.success("Email copied!", {
        description: `${email} copied to clipboard`,
      });
    }).catch(() => {
      // Fallback to mailto
      window.location.href = buildEmailLink(subject);
    });
  } else {
    // Mobile or fallback: use mailto
    window.location.href = buildEmailLink(subject);
  }
}

// Enhanced email click handler
export function handleEmailClick(subject?: string, listingSlug?: string): void {
  // Track analytics
  if (listingSlug) {
    trackEmailClick(undefined, listingSlug);
  } else {
    trackEmailClick();
  }
  
  // Copy on desktop, mailto on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    window.location.href = buildEmailLink(subject);
  } else {
    copyEmailToClipboard(subject);
  }
}
