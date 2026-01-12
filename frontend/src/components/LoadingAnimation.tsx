import React, { useEffect, useState, useRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * LoadingAnimation Component
 * 
 * A reusable loading animation component that uses the loading.mp4 video file.
 * Features:
 * - Configurable minimum delay before showing (default 500ms)
 * - Multiple size options (sm, md, lg, xl)
 * - Optional backdrop overlay
 * - Custom loading text
 * - Auto-plays video when visible
 * - Respects the 0.5 second minimum delay requirement
 * 
 * Usage:
 * - Use InlineLoadingAnimation for content areas
 * - Use PageLoadingAnimation for full-page loading
 * - Use OverlayLoadingAnimation for modal/overlay loading
 */

interface LoadingAnimationProps {
  /** Minimum duration in milliseconds before showing the animation (default: 500ms) */
  minDelay?: number;
  /** Size of the loading animation */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show a backdrop */
  backdrop?: boolean;
  /** Custom text to show below the animation */
  text?: string;
  /** Whether the loading state is active */
  isLoading: boolean;
}

const sizeClasses = {
  sm: 'w-16 h-16',
  md: 'w-24 h-24', 
  lg: 'w-32 h-32',
  xl: 'w-48 h-48'
};

export function LoadingAnimation({ 
  minDelay = 500,
  size = 'md',
  className,
  backdrop = false,
  text,
  isLoading 
}: LoadingAnimationProps) {
  const [showAnimation, setShowAnimation] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isLoading) {
      // Start the delay timer
      timeoutRef.current = setTimeout(() => {
        setShowAnimation(true);
      }, minDelay);
    } else {
      // Clear timeout and hide animation immediately
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setShowAnimation(false);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, minDelay]);

  // Auto-play video when animation becomes visible
  useEffect(() => {
    if (showAnimation && videoRef.current) {
      videoRef.current.play().catch(console.error);
    }
  }, [showAnimation]);

  if (!showAnimation) {
    return null;
  }

  const content = (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3",
      backdrop && "fixed inset-0 bg-background/80 backdrop-blur-sm z-50",
      className
    )}>
      <div className={cn(
        "relative overflow-hidden rounded-lg",
        sizeClasses[size]
      )}>
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/loading.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div className="w-full h-full bg-gradient-to-r from-primary/20 to-primary/40 animate-pulse rounded-lg" />
        </video>
      </div>
      
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  return content;
}

// Specialized loading components for common use cases
export function PageLoadingAnimation({ text = "Loading..." }: { text?: string }) {
  return (
    <LoadingAnimation
      isLoading={true}
      size="lg"
      backdrop={true}
      text={text}
      className="animate-fade-in"
    />
  );
}

export function InlineLoadingAnimation({ 
  text, 
  size = 'sm',
  isLoading 
}: { 
  text?: string; 
  size?: 'sm' | 'md' | 'lg';
  isLoading: boolean;
}) {
  return (
    <LoadingAnimation
      isLoading={isLoading}
      size={size}
      text={text}
      className="py-8"
      minDelay={300} // Shorter delay for inline loading
    />
  );
}

export function OverlayLoadingAnimation({ 
  text = "Loading...",
  isLoading 
}: { 
  text?: string;
  isLoading: boolean;
}) {
  return (
    <LoadingAnimation
      isLoading={isLoading}
      size="md"
      backdrop={true}
      text={text}
      className="animate-fade-in"
    />
  );
}