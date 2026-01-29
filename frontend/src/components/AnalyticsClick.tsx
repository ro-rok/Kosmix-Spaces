/**
 * AnalyticsClick - Wrapper component for tracking click events
 * Automatically tracks clicks on wrapped elements with analytics
 */

import React from 'react';
import { analytics, EventName, EventMetadata } from '@/lib/analytics';

interface AnalyticsClickProps {
  event: EventName;
  metadata?: EventMetadata;
  children: React.ReactElement;
  onClick?: (e: React.MouseEvent) => void;
  /** Whether to prevent default behavior */
  preventDefault?: boolean;
  /** Whether to stop propagation */
  stopPropagation?: boolean;
}

/**
 * Wrapper component that tracks click events automatically
 * 
 * Usage:
 * ```tsx
 * <AnalyticsClick event="cta_click" metadata={{ ctaType: "whatsapp" }}>
 *   <Button>WhatsApp</Button>
 * </AnalyticsClick>
 * ```
 */
export function AnalyticsClick({ 
  event, 
  metadata, 
  children, 
  onClick,
  preventDefault = false,
  stopPropagation = false
}: AnalyticsClickProps) {
  const handleClick = (e: React.MouseEvent) => {
    // Track the click event
    analytics.track(event, {
      ...metadata,
      buttonId: children.props.id || children.props['data-id'],
      buttonText: typeof children.props.children === 'string' 
        ? children.props.children 
        : undefined,
      elementType: children.type,
      className: children.props.className,
    });
    
    // Call original onClick if provided
    if (onClick) {
      onClick(e);
    }
    
    // Handle preventDefault and stopPropagation
    if (preventDefault) {
      e.preventDefault();
    }
    if (stopPropagation) {
      e.stopPropagation();
    }
  };
  
  return React.cloneElement(children, { 
    onClick: handleClick,
    'data-analytics': event,
    'data-analytics-tracked': 'true'
  });
}

/**
 * Hook for tracking clicks programmatically
 */
export function useAnalyticsClick() {
  return (event: EventName, metadata?: EventMetadata) => {
    analytics.track(event, metadata);
  };
}
