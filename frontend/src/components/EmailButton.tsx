/**
 * EmailButton - Component for email actions with clipboard copy + mailto fallback
 * Handles desktop (clipboard) and mobile (mailto) gracefully
 */

import React, { useState } from 'react';
import { Mail, Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { contactConfig } from '@/config/contact';
import { buildEmailLink } from '@/lib/whatsapp';
import { trackEmailClick } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface EmailButtonProps {
  /** Email address to use (defaults to contact config) */
  email?: string;
  /** Subject line for mailto */
  subject?: string;
  /** Button variant */
  variant?: 'default' | 'outline' | 'ghost';
  /** Button size */
  size?: 'default' | 'sm' | 'lg' | 'icon';
  /** Additional className */
  className?: string;
  /** Show email address in button text */
  showEmail?: boolean;
  /** Context for analytics */
  context?: 'partner' | 'public';
  /** Children (if provided, replaces default content) */
  children?: React.ReactNode;
}

/**
 * EmailButton component with clipboard copy (desktop) and mailto fallback
 * 
 * Desktop: Copies email to clipboard + shows toast
 * Mobile: Opens mailto link
 */
export function EmailButton({
  email = contactConfig.email,
  subject,
  variant = 'outline',
  size = 'default',
  className,
  showEmail = false,
  context = 'public',
  children
}: EmailButtonProps) {
  const [copied, setCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Track email click
    trackEmailClick(undefined, undefined, { context });
    
    // Mobile: always use mailto
    if (isMobile) {
      window.location.href = buildEmailLink(subject);
      return;
    }
    
    // Desktop: try clipboard first, fallback to mailto
    try {
      // Check if clipboard API is available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(email);
        setCopied(true);
        toast.success('Email copied to clipboard', {
          description: email,
          duration: 3000,
        });
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback: use mailto
        window.location.href = buildEmailLink(subject);
      }
    } catch (error) {
      // Clipboard failed, use mailto fallback
      window.location.href = buildEmailLink(subject);
    }
  };

  const buttonContent = children || (
    <>
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <Mail className="h-4 w-4" />
          {showEmail ? (
            <span>{email}</span>
          ) : (
            <span>Email Us</span>
          )}
        </>
      )}
    </>
  );

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(className)}
      aria-label={`${copied ? 'Email copied' : 'Copy email'} ${email}`}
    >
      {buttonContent}
    </Button>
  );
}

/**
 * Simple email link component (always uses mailto)
 */
export function EmailLink({
  email = contactConfig.email,
  subject,
  className,
  children
}: {
  email?: string;
  subject?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const handleClick = () => {
    trackEmailClick(undefined, undefined, { context: 'public' });
  };

  return (
    <a
      href={buildEmailLink(subject)}
      onClick={handleClick}
      className={className}
    >
      {children || email}
    </a>
  );
}
