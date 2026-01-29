/**
 * SEO helper utilities for generating structured data and breadcrumbs
 */

const SITE_URL = "https://kosmixspaces.in";

export interface BreadcrumbItem {
  name: string;
  url: string;
}

/**
 * Generate BreadcrumbList structured data
 */
export function generateBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url.startsWith('http') ? item.url : `${SITE_URL}${item.url.startsWith('/') ? item.url : `/${item.url}`}`
    }))
  };
}

/**
 * Generate Organization schema for homepage
 */
export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Kosmix Spaces",
    "url": SITE_URL,
    "logo": `${SITE_URL}/logo.png`,
    "description": "Verified coworking spaces platform for Delhi NCR. Zero brokerage, site visits arranged.",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+919555457457",
      "contactType": "Customer Service",
      "areaServed": "IN",
      "availableLanguage": "en"
    },
    "sameAs": [
      // Add social media profiles if available
    ]
  };
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Kosmix Spaces",
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/explore?q={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * Clean structured data by removing undefined/null values
 */
export function cleanStructuredData(data: Record<string, any>): Record<string, any> {
  const cleaned: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null) {
      continue;
    }
    
    if (Array.isArray(value)) {
      const filtered = value.filter(item => item !== undefined && item !== null);
      if (filtered.length > 0) {
        cleaned[key] = filtered.map(item => 
          typeof item === 'object' && item !== null ? cleanStructuredData(item) : item
        );
      }
    } else if (typeof value === 'object' && value !== null) {
      const cleanedObj = cleanStructuredData(value);
      if (Object.keys(cleanedObj).length > 0) {
        cleaned[key] = cleanedObj;
      }
    } else {
      cleaned[key] = value;
    }
  }
  
  return cleaned;
}

/**
 * Generate opening hours schema from access hours string
 */
export function generateOpeningHours(accessHours: string): string[] | undefined {
  if (!accessHours) return undefined;
  
  // Common patterns: "24/7", "Mon-Fri 9AM-6PM", "9:00 AM - 6:00 PM"
  // For now, return undefined if we can't parse it properly
  // In future, can add more sophisticated parsing
  if (accessHours.toLowerCase().includes('24/7') || accessHours.toLowerCase().includes('24 hours')) {
    return ["Mo-Su 00:00-23:59"];
  }
  
  // Return undefined for now - can be enhanced later with proper parsing
  return undefined;
}
