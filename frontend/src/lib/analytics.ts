/**
 * Analytics client for tracking user events
 * Currently uses mock implementation since backend analytics endpoints don't exist yet
 */

export interface AnalyticsEvent {
  eventName: string;
  timestamp: number;
  userId?: string;
  userRole: 'anon' | 'partner' | 'admin';
  listingId?: string;
  listingSlug?: string;
  referrer?: string;
  path: string;
  metadata?: Record<string, any>;
}

export type EventName = 
  | 'listing_view'
  | 'enquiry_submit'
  | 'whatsapp_click'
  | 'call_click'
  | 'search_performed'
  | 'filter_applied'
  | 'partner_signup'
  | 'partner_listing_submitted';

class AnalyticsClient {
  private eventQueue: AnalyticsEvent[] = [];
  private batchSize = 10;
  private flushInterval = 5000; // 5 seconds
  private flushTimer: NodeJS.Timeout | null = null;

  constructor() {
    // Start periodic flush
    this.startPeriodicFlush();
  }

  /**
   * Track an analytics event
   */
  track(eventName: EventName, metadata?: Record<string, any>): void {
    const event: AnalyticsEvent = {
      eventName,
      timestamp: Date.now(),
      userRole: this.getUserRole(),
      path: window.location.pathname,
      referrer: document.referrer || undefined,
      metadata,
    };

    // Add listing context if available
    const listingMatch = window.location.pathname.match(/\/listing\/[^\/]+\/[^\/]+\/([^\/]+)/);
    if (listingMatch) {
      event.listingSlug = listingMatch[0];
    }

    this.eventQueue.push(event);

    // Flush if batch size reached
    if (this.eventQueue.length >= this.batchSize) {
      this.flush();
    }
  }

  /**
   * Flush events to backend (currently mock)
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // TODO: Replace with real API call when backend analytics endpoints are available
      console.log('Analytics events (mock):', events);
      
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log(`Flushed ${events.length} analytics events`);
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
      // Re-queue events on failure
      this.eventQueue.unshift(...events);
    }
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
   * Stop periodic flush timer
   */
  destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush(); // Final flush
  }
}

// Global analytics instance
export const analytics = new AnalyticsClient();

// Convenience tracking functions
export const trackListingView = (listingId?: string, listingSlug?: string) => {
  analytics.track('listing_view', { listingId, listingSlug });
};

export const trackEnquirySubmit = (listingId?: string, enquiryType?: string) => {
  analytics.track('enquiry_submit', { listingId, enquiryType });
};

export const trackWhatsAppClick = (listingId?: string) => {
  analytics.track('whatsapp_click', { listingId });
};

export const trackCallClick = (listingId?: string) => {
  analytics.track('call_click', { listingId });
};

export const trackSearchPerformed = (query?: string, filtersCount?: number) => {
  analytics.track('search_performed', { query, filtersCount });
};

export const trackFilterApplied = (filterType: string, filterValue: string) => {
  analytics.track('filter_applied', { filterType, filterValue });
};

export const trackPartnerSignup = () => {
  analytics.track('partner_signup');
};

export const trackPartnerListingSubmitted = (listingId?: string) => {
  analytics.track('partner_listing_submitted', { listingId });
};

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  analytics.destroy();
});