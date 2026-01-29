/**
 * Comprehensive analytics client for tracking user events
 * Implements privacy-compliant event batching with structured data
 */

import { api } from './api';

export interface AnalyticsEvent {
  eventId: string;
  eventName: EventName;
  timestamp: number;
  sessionId: string;
  userRole: 'anon' | 'partner' | 'admin';
  listingId?: string;
  listingSlug?: string;
  partnerId?: string;
  referrer?: string;
  referrerDomain?: string;
  path: string;
  portal?: 'public' | 'partner' | 'admin';
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  utmContent?: string;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  viewportWidth?: number;
  viewportHeight?: number;
  userAgent?: string;
  isFirstTouch?: boolean;
  isLastTouch?: boolean;
  metadata?: EventMetadata;
}

export type EventName = 
  | 'page_view'
  | 'listing_view'
  | 'listing_card_click'
  | 'explore_search'
  | 'search_performed'
  | 'filter_change'
  | 'filter_applied'
  | 'enquiry_submit'
  | 'whatsapp_click'
  | 'call_click'
  | 'email_click'
  | 'partner_signup'
  | 'partner_login'
  | 'partner_listing_submitted'
  | 'admin_verification_action';

export interface EventMetadata {
  // Search-related metadata
  searchQuery?: string;
  filtersApplied?: string[];
  filtersCount?: number;
  
  // Enquiry-related metadata
  enquiryType?: string;
  
  // Listing-related metadata
  offeringType?: string;
  
  // Partner-related metadata
  partnerStatus?: string;
  
  // General metadata
  [key: string]: any;
}

export interface AnalyticsSummary {
  totalViews: number;
  totalEnquiries: number;
  totalSearches: number;
  partnerSignups: number;
  conversionRate: number;
  topListings: Array<{
    listingId: string;
    displayName: string;
    views: number;
    enquiries: number;
  }>;
  topLocalities: Array<{
    locality: string;
    searches: number;
    views: number;
  }>;
}

export interface PartnerAnalytics {
  views: number;
  enquiries: number;
  conversionRate: number;
  topListings: Array<{
    listingId: string;
    displayName: string;
    views: number;
    enquiries: number;
  }>;
}

class AnalyticsClient {
  private eventQueue: AnalyticsEvent[] = [];
  private batchSize = 50; // Increased batch size
  private flushInterval = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private backendAvailable: boolean | null = null; // Cache backend availability
  private firstTouchUTM: Record<string, string> = {};
  private lastTouchUTM: Record<string, string> = {};

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
    
    // Capture UTM parameters
    this.captureUTMParams();
    
    // Check if analytics was previously blocked in this session
    // This prevents making requests that will fail
    const wasBlocked = sessionStorage.getItem('analytics_blocked') === 'true';
    if (wasBlocked) {
      this.backendAvailable = false;
    }
    
    // Start periodic flush
    this.startPeriodicFlush();
    
    // Flush on page unload
    this.setupUnloadHandler();
  }
  
  /**
   * Capture UTM parameters from URL (first-touch attribution)
   */
  private captureUTMParams(): void {
    const params = new URLSearchParams(window.location.search);
    const utm: Record<string, string> = {};
    
    ['source', 'medium', 'campaign', 'term', 'content'].forEach(key => {
      const value = params.get(`utm_${key}`);
      if (value) {
        const camelKey = `utm${key.charAt(0).toUpperCase() + key.slice(1)}`;
        utm[camelKey] = value;
      }
    });
    
    if (Object.keys(utm).length > 0) {
      this.firstTouchUTM = utm;
      sessionStorage.setItem('analytics_first_touch_utm', JSON.stringify(utm));
    } else {
      // Restore from session if exists
      const stored = sessionStorage.getItem('analytics_first_touch_utm');
      if (stored) {
        try {
          this.firstTouchUTM = JSON.parse(stored);
        } catch {
          // Invalid JSON, ignore
        }
      }
    }
  }
  
  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string | undefined {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      return undefined;
    }
  }
  
  /**
   * Detect device type from user agent
   */
  private getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const ua = navigator.userAgent.toLowerCase();
    
    // Mobile detection
    const mobileIndicators = ['mobile', 'android', 'iphone', 'ipod', 'blackberry', 'windows phone'];
    if (mobileIndicators.some(indicator => ua.includes(indicator))) {
      return 'mobile';
    }
    
    // Tablet detection
    const tabletIndicators = ['tablet', 'ipad', 'playbook'];
    if (tabletIndicators.some(indicator => ua.includes(indicator))) {
      return 'tablet';
    }
    
    return 'desktop';
  }
  
  /**
   * Determine portal from path
   */
  private getPortal(): 'public' | 'partner' | 'admin' {
    const path = window.location.pathname;
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/partner')) return 'partner';
    return 'public';
  }

  /**
   * Check if backend is available (cached result)
   */
  private isBackendAvailable(): boolean {
    // If we haven't checked yet, assume it's available
    // The first failed request will set this to false
    return this.backendAvailable !== false;
  }

  /**
   * Track an analytics event with privacy-compliant structure
   */
  track(eventName: EventName, metadata?: EventMetadata): void {
    // Skip analytics in development if backend is not available
    if (import.meta.env.DEV && !this.isBackendAvailable()) {
      return;
    }

    const event: AnalyticsEvent = {
      eventId: this.generateEventId(),
      eventName,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userRole: this.getUserRole(),
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      metadata: this.sanitizeMetadata(metadata),
    };

    // Add listing context if available
    const listingContext = this.extractListingContext();
    if (listingContext.listingId) {
      event.listingId = listingContext.listingId;
    }
    if (listingContext.listingSlug) {
      event.listingSlug = listingContext.listingSlug;
    }

    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Track a critical event with immediate flush
   */
  trackCritical(eventName: EventName, metadata?: EventMetadata): void {
    this.track(eventName, metadata);
    // Flush immediately for critical events
    this.flush();
  }

  /**
   * Flush events to backend with proper error handling
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    // Skip if backend is known to be unavailable (e.g., ad blocker)
    // This prevents making requests that will be blocked
    if (this.backendAvailable === false) {
      // Silently drop events when backend is unavailable
      this.eventQueue = [];
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Use void to explicitly ignore promise rejection
    // This prevents unhandled promise rejection warnings
    void this.sendEventsToBackend(events).then((success) => {
      if (success === true) {
        this.backendAvailable = true;
      } else {
        // Already marked as unavailable in sendEventsToBackend
        // Silently drop events
      }
    }).catch(() => {
      // Errors are already handled in sendEventsToBackend
      // This catch is just to prevent unhandled promise rejections
      this.backendAvailable = false;
    });
  }

  /**
   * Get admin analytics summary
   */
  async getAdminAnalytics(): Promise<AnalyticsSummary> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      
      const response = await fetch(`${API_BASE_URL}/api/analytics/admin`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kosmix_auth_token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch admin analytics:', error);
      // Return empty analytics instead of mock data
      return {
        totalViews: 0,
        totalEnquiries: 0,
        totalSearches: 0,
        partnerSignups: 0,
        conversionRate: 0,
        topListings: [],
        topLocalities: []
      };
    }
  }

  /**
   * Get partner analytics
   */
  async getPartnerAnalytics(partnerId: string): Promise<PartnerAnalytics> {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      
      const response = await fetch(`${API_BASE_URL}/api/analytics/partner/${partnerId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('kosmix_auth_token') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch partner analytics:', error);
      // Return empty analytics instead of mock data
      return {
        views: 0,
        enquiries: 0,
        conversionRate: 0,
        topListings: []
      };
    }
  }

  /**
   * Send events to backend
   * @returns true if successful, false if blocked/offline (silently handled)
   */
  private async sendEventsToBackend(events: AnalyticsEvent[]): Promise<boolean> {
    // Early exit if we know backend is unavailable
    if (this.backendAvailable === false) {
      return false;
    }

    // Check if offline before attempting request
    if (!navigator.onLine) {
      this.backendAvailable = false;
      return false;
    }

    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Convert events to backend format
      const backendEvents = events.map(event => ({
        eventId: event.eventId,
        eventName: event.eventName,
        timestamp: new Date(event.timestamp),
        sessionId: event.sessionId,
        userRole: event.userRole,
        listingId: event.listingId,
        listingSlug: event.listingSlug,
        partnerId: this.getPartnerId(),
        referrer: event.referrer,
        path: event.path,
        metadata: event.metadata
      }));

      // Use the same API base URL as other API calls
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      
      // Send to backend with timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Wrap fetch in a promise that catches all errors silently
      const fetchPromise = fetch(`${API_BASE_URL}/api/analytics/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: backendEvents }),
        signal: controller.signal
      }).catch((fetchError: any) => {
        // Immediately catch fetch errors to prevent console logging
        // This catches errors before they propagate
        if (timeoutId) clearTimeout(timeoutId);
        throw fetchError;
      });

      const response = await fetchPromise;
      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      await response.json();
      this.backendAvailable = true;
      return true; // Success
    } catch (error: any) {
      // Clear timeout in case it wasn't cleared
      if (timeoutId) clearTimeout(timeoutId);
      
      // Detect ad blocker blocking or network issues
      // Ad blockers typically cause TypeError with 'Failed to fetch' or network errors
      const isBlocked = 
        error instanceof TypeError || 
        error?.name === 'TypeError' ||
        error?.name === 'NetworkError' ||
        error?.message === 'Failed to fetch' ||
        error?.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
        error?.message?.includes('NetworkError') ||
        (error instanceof Error && error.message?.toLowerCase().includes('network')) ||
        (error instanceof Error && error.message?.toLowerCase().includes('blocked'));
      
      // Also check if we're offline
      const isOffline = !navigator.onLine;
      
      // Check if request was aborted (timeout or user action)
      const isAborted = error?.name === 'AbortError' || error?.message?.includes('aborted');
      
      if (isBlocked || isOffline || isAborted) {
        // Silently fail - don't log, don't re-throw
        // Mark backend as unavailable to prevent future attempts
        this.backendAvailable = false;
        // Persist blocked state in sessionStorage to prevent retries
        sessionStorage.setItem('analytics_blocked', 'true');
        return false; // Return false to indicate silent failure
      }
      
      // For other errors, only log in dev mode and don't re-throw
      // This prevents unhandled promise rejections
      if (import.meta.env.DEV) {
        console.warn('⚠️ Analytics events could not be sent to backend:', error instanceof Error ? error.message : 'Unknown error');
      }
      
      // Don't re-throw - silently fail to prevent console errors
      this.backendAvailable = false;
      return false;
    }
  }

  /**
   * Get current partner ID for event enrichment
   */
  private getPartnerId(): string | undefined {
    const userType = localStorage.getItem('kosmix_user_type');
    if (userType === 'partner') {
      // Try to get partner ID from stored user data
      // This would need to be set when partner logs in
      return localStorage.getItem('kosmix_partner_id') || undefined;
    }
    return undefined;
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  /**
   * Extract listing context from current URL
   */
  private extractListingContext(): { listingId?: string; listingSlug?: string } {
    const path = window.location.pathname;
    
    // Match listing detail page: /listing/{partnerSlug}/{localitySlug}/{nameSlug}
    const listingMatch = path.match(/\/listing\/([^\/]+\/[^\/]+\/[^\/]+)/);
    if (listingMatch) {
      return {
        listingSlug: listingMatch[1]
      };
    }
    
    // Match premium space detail: /space/{slug}
    const spaceMatch = path.match(/\/space\/([^\/]+)/);
    if (spaceMatch) {
      return {
        listingSlug: spaceMatch[1]
      };
    }
    
    return {};
  }

  /**
   * Sanitize metadata to ensure no PII is included
   */
  private sanitizeMetadata(metadata?: EventMetadata): EventMetadata | undefined {
    if (!metadata) return undefined;
    
    // Remove any potential PII fields
    const sanitized = { ...metadata };
    delete sanitized.email;
    delete sanitized.phone;
    delete sanitized.name;
    delete sanitized.address;
    
    return sanitized;
  }

  /**
   * Get current user role
   */
  private getUserRole(): 'anon' | 'partner' | 'admin' {
    const userType = localStorage.getItem('kosmix_user_type');
    if (userType === 'partner' || userType === 'admin') {
      return userType;
    }
    return 'anon';
  }

  /**
   * Start periodic flush timer
   */
  private startPeriodicFlush(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Setup unload handler for final flush
   */
  private setupUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      this.destroy();
    });
  }

  /**
   * Stop periodic flush timer and perform final flush
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    
    // Synchronous flush on unload (best effort)
    if (this.eventQueue.length > 0) {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const events = this.eventQueue.map(event => ({
        eventId: event.eventId,
        eventName: event.eventName,
        timestamp: new Date(event.timestamp),
        sessionId: event.sessionId,
        userRole: event.userRole,
        listingId: event.listingId,
        listingSlug: event.listingSlug,
        partnerId: event.partnerId,
        referrer: event.referrer,
        referrerDomain: event.referrerDomain,
        path: event.path,
        portal: event.portal,
        utmSource: event.utmSource,
        utmMedium: event.utmMedium,
        utmCampaign: event.utmCampaign,
        utmTerm: event.utmTerm,
        utmContent: event.utmContent,
        deviceType: event.deviceType,
        viewportWidth: event.viewportWidth,
        viewportHeight: event.viewportHeight,
        userAgent: event.userAgent,
        metadata: event.metadata
      }));
      
      navigator.sendBeacon(
        `${API_BASE_URL}/api/analytics/events`,
        JSON.stringify({ events })
      );
    }
  }
}

// Global analytics instance
export const analytics = new AnalyticsClient();

// Convenience tracking functions with enhanced metadata
export const trackListingView = (listingId?: string, listingSlug?: string, metadata?: EventMetadata) => {
  analytics.track('listing_view', { 
    listingId, 
    listingSlug,
    ...metadata
  });
};

export const trackEnquirySubmit = (listingId?: string, enquiryType?: string, metadata?: EventMetadata) => {
  analytics.track('enquiry_submit', { 
    listingId, 
    enquiryType,
    ...metadata
  });
};

export const trackWhatsAppClick = (listingId?: string, metadata?: EventMetadata) => {
  analytics.track('whatsapp_click', { 
    listingId,
    ...metadata
  });
};

export const trackCallClick = (listingId?: string, metadata?: EventMetadata) => {
  analytics.track('call_click', { 
    listingId,
    ...metadata
  });
};

export const trackSearchPerformed = (query?: string, filtersApplied?: string[], metadata?: EventMetadata) => {
  analytics.track('search_performed', { 
    searchQuery: query,
    filtersApplied,
    filtersCount: filtersApplied?.length || 0,
    ...metadata
  });
};

export const trackFilterApplied = (filterType: string, filterValue: string, metadata?: EventMetadata) => {
  analytics.track('filter_applied', { 
    filterType, 
    filterValue,
    ...metadata
  });
};

export const trackPartnerSignup = (partnerStatus?: string, metadata?: EventMetadata) => {
  analytics.track('partner_signup', {
    partnerStatus,
    ...metadata
  });
};

export const trackPartnerListingSubmitted = (listingId?: string, offeringType?: string, metadata?: EventMetadata) => {
  analytics.track('partner_listing_submitted', { 
    listingId,
    offeringType,
    ...metadata
  });
};

export const trackPageView = (pageType: string, metadata?: EventMetadata) => {
  analytics.track('page_view', { pageType, ...metadata });
};

export const trackListingCardClick = (listingSlug: string, position: number, metadata?: EventMetadata) => {
  analytics.track('listing_card_click', {
    listingSlug,
    position,
    ...metadata
  });
};

export const trackEmailClick = (listingId?: string, listingSlug?: string, metadata?: EventMetadata) => {
  analytics.track('email_click', { listingId, listingSlug, ...metadata });
};

export const trackPartnerLogin = (metadata?: EventMetadata) => {
  analytics.track('partner_login', metadata);
};

export const trackAdminVerificationAction = (action: 'approve' | 'reject', listingId: string, reason?: string) => {
  analytics.trackCritical('admin_verification_action', {
    action,
    listingId,
    reason
  });
};