/**
 * Slug generation utilities for listing URLs
 * Format: /listing/{partnerSlug}/{localitySlug}/{nameSlug}
 */

/**
 * Convert text to URL-safe slug format
 * Ensures no double hyphens and no leading/trailing hyphens
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters except spaces and hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Generate deterministic 6-character hash suffix from listingId
 * Uses a simple hash function for consistency across calls
 */
export function generateHashSuffix(listingId: string): string {
  // Simple hash function for deterministic suffix
  let hash = 0;
  for (let i = 0; i < listingId.length; i++) {
    const char = listingId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Convert to base36 and take first 6 characters, pad if needed
  return Math.abs(hash).toString(36).substring(0, 6).padStart(6, '0');
}

/**
 * Generate complete slug for a listing
 * Format: /listing/{partnerSlug}/{localitySlug}/{nameSlug}
 */
export function generateSlug(partner: string, locality: string, name: string): string {
  const partnerSlug = slugify(partner);
  const localitySlug = slugify(locality);
  const nameSlug = slugify(name);
  
  // Ensure no empty segments
  if (!partnerSlug || !localitySlug || !nameSlug) {
    throw new Error('All slug components (partner, locality, name) must be non-empty after slugification');
  }
  
  return `/listing/${partnerSlug}/${localitySlug}/${nameSlug}`;
}

/**
 * Resolve slug collision by appending hash suffix
 * Returns slug with deterministic hash suffix: {baseSlug}-{hash6}
 */
export function resolveSlugCollision(baseSlug: string, listingId: string): string {
  const hashSuffix = generateHashSuffix(listingId);
  return `${baseSlug}-${hashSuffix}`;
}

/**
 * Extract slug components from a full slug path
 */
export function parseSlug(slug: string): {
  partnerSlug: string;
  localitySlug: string;
  nameSlug: string;
} | null {
  const match = slug.match(/^\/listing\/([^\/]+)\/([^\/]+)\/([^\/]+)$/);
  if (!match) return null;
  
  return {
    partnerSlug: match[1],
    localitySlug: match[2],
    nameSlug: match[3]
  };
}

/**
 * Generate client-side preview slug (before listing is created)
 */
export function generatePreviewSlug(partner: string, locality: string, name: string): string {
  return generateSlug(partner, locality, name);
}

/**
 * Check if a slug has a hash suffix (collision resolution)
 */
export function hasHashSuffix(slug: string): boolean {
  return /-[a-z0-9]{6}$/.test(slug);
}