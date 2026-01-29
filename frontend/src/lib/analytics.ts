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
  private batchSize = 1; // Send events individually (no batching)
  private flushInterval = 100; // Flush immediately (100ms delay for any queued events)
  private flushTimer: NodeJS.Timeout | null = null;
  private sessionId: string;
  private backendAvailable: boolean | null = null; // Cache backend availability
  private firstTouchUTM: Record<string, string> = {};
  private lastTouchUTM: Record<string, string> = {};
  private readonly RETRY_AFTER_MS = 5 * 60 * 1000; // 5 minutes

  constructor() {
    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
    
    // Capture UTM parameters
    this.captureUTMParams();
    
    // Check if analytics was previously blocked in this session
    // This prevents making requests that will fail
    const blockedState = this.getBlockedState();
    if (blockedState?.blocked) {
      // Check if retry time has passed
      if (blockedState.timestamp && Date.now() - blockedState.timestamp < this.RETRY_AFTER_MS) {
        this.backendAvailable = false;
      } else {
        // Retry time has passed, clear blocked state and test again
        this.clearBlockedState();
      }
    }
    
    // Detect ad blocker on initialization (async, non-blocking)
    void this.detectAdBlocker();
    
    // Initialize debug indicator if debug mode is enabled
    if (this.isDebugMode() && import.meta.env.DEV) {
      this.initDebugIndicator();
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
   * Get blocked state from sessionStorage
   */
  private getBlockedState(): { blocked: boolean; timestamp: number } | null {
    try {
      const stored = sessionStorage.getItem('analytics_blocked');
      if (!stored) return null;
      
      const parsed = JSON.parse(stored);
      return {
        blocked: parsed.blocked === true,
        timestamp: parsed.timestamp || Date.now()
      };
    } catch {
      // Legacy format: just 'true' string
      const stored = sessionStorage.getItem('analytics_blocked');
      if (stored === 'true') {
        return { blocked: true, timestamp: Date.now() };
      }
      return null;
    }
  }

  /**
   * Clear blocked state from sessionStorage
   */
  private clearBlockedState(): void {
    sessionStorage.removeItem('analytics_blocked');
    this.backendAvailable = null;
  }

  /**
   * Set blocked state in sessionStorage with timestamp
   */
  private setBlockedState(): void {
    try {
      sessionStorage.setItem('analytics_blocked', JSON.stringify({
        blocked: true,
        timestamp: Date.now()
      }));
    } catch {
      // Fallback to simple string if JSON fails
      sessionStorage.setItem('analytics_blocked', 'true');
    }
  }

  /**
   * Detect if ad blocker is active by testing backend availability
   * Runs once on initialization and stores result
   */
  private async detectAdBlocker(): Promise<void> {
    // Skip if we already know backend is unavailable
    if (this.backendAvailable === false) {
      return;
    }

    // Skip if offline
    if (!navigator.onLine) {
      return;
    }

    // Check if we should retry based on timestamp
    const blockedState = this.getBlockedState();
    if (blockedState?.blocked && blockedState.timestamp) {
      const timeSinceBlock = Date.now() - blockedState.timestamp;
      if (timeSinceBlock < this.RETRY_AFTER_MS) {
        // Still within retry window, skip detection
        this.backendAvailable = false;
        return;
      }
    }

    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const testUrl = `${API_BASE_URL}/api/analytics/events`;
      
      // Create a minimal test request with a valid event
      // The backend requires at least 1 event, so we create a minimal test event
      const testEvent = {
        eventId: `test_${Date.now()}`,
        eventName: 'page_view',
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        userRole: 'anon',
        path: window.location.pathname
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout for detection
      
      await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ events: [testEvent] }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // If we get here, backend is available
      this.backendAvailable = true;
      this.clearBlockedState();
      
      if (this.isDebugMode()) {
        console.debug('[Analytics] Backend availability confirmed');
      }
      } catch (error: any) {
        // Check if this is a validation error (422) - don't treat as ad blocker
        const isValidationError = error?.message?.includes('422') || 
                                  error?.message?.includes('Validation failed') ||
                                  error?.message?.includes('Unprocessable');
        
        if (isValidationError) {
          // Validation error means backend is reachable, just had bad data
          // This is fine for detection - backend is available
          this.backendAvailable = true;
          this.clearBlockedState();
          
          if (this.isDebugMode()) {
            console.debug('[Analytics] Backend available (validation error in test, but backend is reachable)');
          }
          return;
        }
        
        // Check if this is an ad blocker block
        const isBlocked = 
          error instanceof TypeError ||
          error?.name === 'TypeError' ||
          error?.name === 'NetworkError' ||
          error?.message === 'Failed to fetch' ||
          error?.message?.includes('ERR_BLOCKED_BY_CLIENT') ||
          error?.message?.includes('NetworkError') ||
          (error instanceof Error && error.message?.toLowerCase().includes('network')) ||
          (error instanceof Error && error.message?.toLowerCase().includes('blocked')) ||
          error?.name === 'AbortError';
        
        if (isBlocked) {
          // Ad blocker detected
          this.backendAvailable = false;
          this.setBlockedState();
          
          if (this.isDebugMode()) {
            console.debug('[Analytics] Ad blocker detected, analytics will be disabled');
          }
        } else {
          // Other error (network, timeout, etc.) - don't mark as blocked
          // Allow normal operation to handle it
          if (this.isDebugMode()) {
            console.debug('[Analytics] Backend detection failed (non-blocker):', error?.message);
          }
        }
      }
  }

  /**
   * Normalize slug to /listing/{slug} format
   */
  private normalizeSlug(slug?: string): string | undefined {
    if (!slug) return undefined;
    
    // If already in /listing/ format, return as-is
    if (slug.startsWith('/listing/')) {
      return slug;
    }
    
    // Remove leading slash if present, then prepend /listing/
    const cleanSlug = slug.startsWith('/') ? slug.slice(1) : slug;
    return `/listing/${cleanSlug}`;
  }

  /**
   * Track an analytics event with privacy-compliant structure
   */
  track(eventName: EventName, metadata?: EventMetadata): void {
    // Don't skip tracking - let flush handle backend availability
    // This ensures events are queued even if backend was previously unavailable

    // Normalize slug from metadata if present
    let normalizedSlug: string | undefined;
    if (metadata?.listingSlug) {
      normalizedSlug = this.normalizeSlug(metadata.listingSlug as string);
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

    // Add listing context if available (from URL or metadata)
    const listingContext = this.extractListingContext();
    
    // Prefer slug from metadata (explicit), then from URL context
    if (normalizedSlug) {
      event.listingSlug = normalizedSlug;
    } else if (listingContext.listingSlug) {
      event.listingSlug = listingContext.listingSlug;
    }
    
    // Prefer listingId from metadata, then from URL context
    if (metadata?.listingId) {
      event.listingId = metadata.listingId as string;
    } else if (listingContext.listingId) {
      event.listingId = listingContext.listingId;
    }

    // Debug logging
    if (this.isDebugMode() || import.meta.env.DEV) {
      console.log('[Analytics] Tracking event:', {
        eventName,
        listingSlug: event.listingSlug,
        listingId: event.listingId,
        path: event.path,
        userRole: event.userRole,
        queueLength: this.eventQueue.length + 1
      });
    }

    this.eventQueue.push(event);

    // Update debug indicator
    if (this.isDebugMode() && import.meta.env.DEV) {
      this.updateDebugIndicator(0, this.eventQueue.length);
    }

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
    if (this.isDebugMode() || import.meta.env.DEV) {
      console.log('[Analytics] Critical event, flushing immediately. Queue length:', this.eventQueue.length);
    }
    this.flush();
  }

  /**
   * Flush events to backend with proper error handling
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    // Early exit: Check blocked state before attempting any requests
    const blockedState = this.getBlockedState();
    if (blockedState?.blocked) {
      const timeSinceBlock = Date.now() - (blockedState.timestamp || Date.now());
      
      // If still within retry window, skip silently
      if (timeSinceBlock < this.RETRY_AFTER_MS) {
        if (this.isDebugMode()) {
          console.debug('[Analytics] Skipping flush - ad blocker detected (retry in', Math.round((this.RETRY_AFTER_MS - timeSinceBlock) / 1000), 'seconds)');
        }
        this.eventQueue = [];
        this.backendAvailable = false;
        return;
      } else {
        // Retry time has passed, clear blocked state and try again
        this.clearBlockedState();
      }
    }

    // Reset backend availability if it was previously marked as unavailable
    // This allows retry after network issues are resolved
    if (this.backendAvailable === false && navigator.onLine) {
      // Reset availability to allow retry
      this.backendAvailable = null;
      this.clearBlockedState();
    }

    // Skip if backend is known to be unavailable AND we're offline
    if (this.backendAvailable === false && !navigator.onLine) {
      // Silently drop events when backend is unavailable and offline
      if (this.isDebugMode()) {
        console.debug('[Analytics] Backend unavailable and offline, dropping', this.eventQueue.length, 'events');
      }
      this.eventQueue = [];
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    // Debug logging
    if (this.isDebugMode() || import.meta.env.DEV) {
      console.log('[Analytics] Flushing', events.length, 'events:', events.map(e => e.eventName));
      this.updateDebugIndicator(0, events.length);
    }

    // Use void to explicitly ignore promise rejection
    // This prevents unhandled promise rejection warnings
    void this.sendEventsToBackend(events).then((success) => {
      if (success === true) {
        this.backendAvailable = true;
        if (this.isDebugMode()) {
          console.log('[Analytics] Successfully sent', events.length, 'events');
          this.updateDebugIndicator(events.length, 0);
        }
      } else {
        // Already marked as unavailable in sendEventsToBackend
        // Silently drop events
        if (this.isDebugMode()) {
          console.warn('[Analytics] Failed to send events');
        }
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
   * Convert events to backend format
   */
  private convertEventsToBackendFormat(events: AnalyticsEvent[]): Array<Record<string, any>> {
    return events.map(event => {
      // Ensure required fields are present and valid
      const backendEvent: Record<string, any> = {
        eventId: event.eventId,
        eventName: event.eventName,
        timestamp: new Date(event.timestamp).toISOString(),
        sessionId: event.sessionId,
        userRole: event.userRole,
        path: event.path || window.location.pathname, // Fallback to current path if not set
      };

      // Add optional fields only if they exist
      if (event.listingId) backendEvent.listingId = event.listingId;
      if (event.listingSlug) backendEvent.listingSlug = event.listingSlug;
      const partnerId = this.getPartnerId();
      if (partnerId) backendEvent.partnerId = partnerId;
      if (event.referrer) backendEvent.referrer = event.referrer;
      if (event.metadata) backendEvent.metadata = event.metadata;

      return backendEvent;
    });
  }

  /**
   * Send events using sendBeacon API (fallback for ad blockers)
   */
  private sendEventsViaBeacon(events: AnalyticsEvent[]): boolean {
    try {
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const url = `${API_BASE_URL}/api/analytics/events`;
      const backendEvents = this.convertEventsToBackendFormat(events);
      const payload = JSON.stringify({ events: backendEvents });
      
      // sendBeacon has a size limit (~64KB), check if we're within limits
      if (new Blob([payload]).size > 64000) {
        // Too large, split into smaller chunks
        const chunkSize = Math.ceil(events.length / Math.ceil(new Blob([payload]).size / 64000));
        for (let i = 0; i < events.length; i += chunkSize) {
          const chunk = events.slice(i, i + chunkSize);
          const chunkPayload = JSON.stringify({ events: this.convertEventsToBackendFormat(chunk) });
          if (!navigator.sendBeacon(url, chunkPayload)) {
            return false;
          }
        }
        return true;
      }
      
      const success = navigator.sendBeacon(url, payload);
      if (success && this.isDebugMode()) {
        console.debug('[Analytics] Events sent via sendBeacon:', events.length);
      }
      return success;
    } catch (error) {
      if (this.isDebugMode()) {
        console.debug('[Analytics] sendBeacon failed:', error);
      }
      return false;
    }
  }

  /**
   * Send events to backend
   * @returns true if successful, false if blocked/offline (silently handled)
   */
  private async sendEventsToBackend(events: AnalyticsEvent[]): Promise<boolean> {
    // Early exit if we know backend is unavailable
    if (this.backendAvailable === false) {
      // Try sendBeacon as fallback
      return this.sendEventsViaBeacon(events);
    }

    // Check if offline before attempting request
    if (!navigator.onLine) {
      this.backendAvailable = false;
      // Try sendBeacon as fallback (works even when offline flag is set)
      return this.sendEventsViaBeacon(events);
    }

    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      // Convert events to backend format
      const backendEvents = this.convertEventsToBackendFormat(events);

      // Use the same API base URL as other API calls
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
      const url = `${API_BASE_URL}/api/analytics/events`;
      
      // Debug logging (only in debug mode)
      if (this.isDebugMode()) {
        console.debug('[Analytics] Sending events to:', url, 'Events:', backendEvents.length);
        console.debug('[Analytics] Event payload:', JSON.stringify(backendEvents[0], null, 2));
      }
      
      // Send to backend with timeout
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      // Wrap fetch in a promise that catches all errors silently
      const fetchPromise = fetch(url, {
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
        // Only log in debug mode
        if (this.isDebugMode()) {
          console.debug('[Analytics] Fetch error:', fetchError);
        }
        throw fetchError;
      });

      const response = await fetchPromise;
      if (timeoutId) clearTimeout(timeoutId);

      if (!response.ok) {
        // Try to get error details for 422 validation errors
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        if (response.status === 422) {
          try {
            const errorData = await response.json();
            if (errorData?.error?.details?.errors) {
              const validationErrors = errorData.error.details.errors
                .map((e: any) => `${e.field}: ${e.message}`)
                .join(', ');
              errorMessage = `Validation failed: ${validationErrors}`;
              // Log validation errors for debugging
              console.error('[Analytics] Validation error:', validationErrors);
              console.error('[Analytics] Failed payload:', JSON.stringify(backendEvents, null, 2));
            } else if (errorData?.detail) {
              errorMessage = `Validation failed: ${errorData.detail}`;
              console.error('[Analytics] Validation error:', errorData.detail);
            } else {
              // Log the full error response for debugging
              console.error('[Analytics] Validation error response:', errorData);
            }
          } catch (parseError) {
            // If we can't parse error, use default message
            console.error('[Analytics] Failed to parse error response:', parseError);
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      
      // Debug logging (only in debug mode)
      if (this.isDebugMode()) {
        console.debug('[Analytics] Server response:', result);
      }
      
      this.backendAvailable = true;
      this.clearBlockedState(); // Clear any blocked state on success
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
        // Try sendBeacon as fallback before giving up
        if (isBlocked && navigator.sendBeacon) {
          const beaconSuccess = this.sendEventsViaBeacon(events);
          if (beaconSuccess) {
            // sendBeacon succeeded, don't mark as blocked
            if (this.isDebugMode()) {
              console.debug('[Analytics] Fallback sendBeacon succeeded');
            }
            return true;
          }
        }
        
        // Silently fail - don't log errors (only in debug mode)
        // Mark backend as unavailable to prevent future attempts
        this.backendAvailable = false;
        // Persist blocked state with timestamp
        this.setBlockedState();
        
        // Only log in debug mode
        if (this.isDebugMode()) {
          console.debug('[Analytics] Request blocked/offline, events dropped:', events.length);
        }
        
        return false; // Return false to indicate silent failure
      }
      
      // For other errors, only log in debug mode
      if (this.isDebugMode()) {
        console.debug('[Analytics] Events could not be sent:', error instanceof Error ? error.message : 'Unknown error');
      }
      
      // Mark backend as unavailable, but don't persist for network errors
      // This allows retry on next flush
      if (!isBlocked && !isOffline && !isAborted) {
        // Only mark as unavailable for actual backend errors, not network issues
        this.backendAvailable = false;
      }
      return false;
    }
  }

  /**
   * Get current partner ID for event enrichment
   */
  private getPartnerId(): string | undefined {
    const userType = localStorage.getItem('kosmix_user_type');
    if (userType === 'partner') {
      // Try multiple sources for partner ID
      // 1. Check localStorage (set during login)
      const storedPartnerId = localStorage.getItem('kosmix_partner_id');
      if (storedPartnerId) {
        return storedPartnerId;
      }
      
      // 2. Try to get from auth context via window (if available)
      // This is a fallback if localStorage isn't set
      try {
        // Check if we can access the auth context
        const authData = sessionStorage.getItem('partner_auth_data');
        if (authData) {
          const parsed = JSON.parse(authData);
          if (parsed.partnerId) {
            return parsed.partnerId;
          }
        }
      } catch {
        // Ignore errors
      }
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
    const listingMatch = path.match(/\/listing\/(.+)/);
    if (listingMatch) {
      const slug = listingMatch[1];
      // Normalize to /listing/{slug} format
      const normalizedSlug = slug.startsWith('/listing/') ? slug : `/listing/${slug}`;
      return {
        listingSlug: normalizedSlug
      };
    }
    
    // Match premium space detail: /spaces/{slug} (plural - fixed)
    const spaceMatch = path.match(/\/spaces\/(.+)/);
    if (spaceMatch) {
      const slug = spaceMatch[1];
      // Normalize to /listing/{slug} format
      const normalizedSlug = `/listing/${slug}`;
      
      // Debug logging
      if (this.isDebugMode()) {
        console.log('[Analytics] Extracted slug from /spaces/ route:', slug, '→ normalized:', normalizedSlug);
      }
      
      return {
        listingSlug: normalizedSlug
      };
    }
    
    return {};
  }
  
  /**
   * Check if debug mode is enabled
   */
  private isDebugMode(): boolean {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('debugAnalytics') === '1' || localStorage.getItem('debugAnalytics') === 'true';
  }

  /**
   * Initialize debug indicator on page (for development)
   */
  private initDebugIndicator(): void {
    // Remove existing indicator if any
    const existing = document.getElementById('analytics-debug-indicator');
    if (existing) {
      existing.remove();
    }

    // Create debug indicator element
    const indicator = document.createElement('div');
    indicator.id = 'analytics-debug-indicator';
    indicator.style.cssText = `
      position: fixed;
      bottom: 10px;
      right: 10px;
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 8px 12px;
      border-radius: 4px;
      font-family: monospace;
      font-size: 12px;
      z-index: 9999;
      pointer-events: none;
    `;
    indicator.textContent = 'Analytics: 0 queued';
    document.body.appendChild(indicator);
  }

  /**
   * Update debug indicator with current queue status
   */
  private updateDebugIndicator(sent: number, queued: number): void {
    const indicator = document.getElementById('analytics-debug-indicator');
    if (indicator) {
      if (sent > 0) {
        indicator.textContent = `Analytics: ${sent} sent, ${queued} queued`;
        indicator.style.background = 'rgba(0, 128, 0, 0.8)';
      } else if (queued > 0) {
        indicator.textContent = `Analytics: ${queued} queued`;
        indicator.style.background = 'rgba(0, 0, 0, 0.8)';
      } else {
        indicator.textContent = 'Analytics: idle';
        indicator.style.background = 'rgba(0, 0, 0, 0.8)';
      }
    }
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
   * Start periodic flush timer (disabled since we flush immediately)
   */
  private startPeriodicFlush(): void {
    // No periodic flush needed since we flush immediately on each event
    // This is kept for potential future use but doesn't run
    // this.flushTimer = setInterval(() => {
    //   this.flush();
    // }, this.flushInterval);
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
  // Use trackCritical to flush immediately for listing views
  analytics.trackCritical('listing_view', { 
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
  // Normalize slug to /listing/{slug} format
  const normalizedSlug = listingSlug.startsWith('/listing/') 
    ? listingSlug 
    : `/listing/${listingSlug.startsWith('/') ? listingSlug.slice(1) : listingSlug}`;
  
  analytics.track('listing_card_click', {
    listingSlug: normalizedSlug,
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