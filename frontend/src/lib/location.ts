/**
 * Location utilities with privacy protection
 */

export interface LocationData {
  locality: string;
  city: string;
  approximateCoordinates?: {
    lat: number;
    lng: number;
  };
}

export interface PrivateLocationData extends LocationData {
  exactAddress?: string; // Only used internally, never in public APIs
}

/**
 * Round coordinates to 2 decimal places for privacy protection
 * This provides locality-level accuracy while protecting exact addresses
 */
export function roundCoordinatesForPrivacy(lat: number, lng: number): {
  lat: number;
  lng: number;
} {
  return {
    lat: Math.round(lat * 100) / 100,
    lng: Math.round(lng * 100) / 100,
  };
}

/**
 * Create privacy-protected location data for public display
 * Removes exact address and rounds coordinates
 */
export function createPublicLocationData(location: PrivateLocationData): LocationData {
  const publicLocation: LocationData = {
    locality: location.locality,
    city: location.city,
  };

  if (location.approximateCoordinates) {
    publicLocation.approximateCoordinates = roundCoordinatesForPrivacy(
      location.approximateCoordinates.lat,
      location.approximateCoordinates.lng
    );
  }

  return publicLocation;
}

/**
 * Format location display for UI
 * Always shows locality + city, never exact address
 */
export function formatLocationDisplay(location: LocationData): string {
  return `${location.locality}, ${location.city}`;
}

/**
 * Get location privacy disclaimer text
 */
export function getLocationPrivacyDisclaimer(): string {
  return "Exact location shared after enquiry";
}

/**
 * Validate that location data doesn't contain exact address information
 * Used to ensure public APIs don't leak private data
 */
export function validateLocationPrivacy(location: any): {
  isValid: boolean;
  violations: string[];
} {
  const violations: string[] = [];

  // Check for exact address fields that shouldn't be in public data
  const forbiddenFields = [
    'exactAddress',
    'address',
    'streetAddress',
    'buildingName',
    'buildingNumber',
    'street',
    'pincode',
    'zipcode',
  ];

  forbiddenFields.forEach(field => {
    if (location[field]) {
      violations.push(`Field '${field}' contains exact address information`);
    }
  });

  // Check if coordinates are too precise (more than 2 decimal places)
  if (location.approximateCoordinates) {
    const { lat, lng } = location.approximateCoordinates;
    
    if (lat && (lat * 100) % 1 !== 0) {
      violations.push('Latitude is too precise (more than 2 decimal places)');
    }
    
    if (lng && (lng * 100) % 1 !== 0) {
      violations.push('Longitude is too precise (more than 2 decimal places)');
    }
  }

  return {
    isValid: violations.length === 0,
    violations,
  };
}

/**
 * Generate approximate coordinates from exact coordinates
 * Rounds to locality center or 2 decimal places for privacy
 */
export function generateApproximateCoordinates(
  exactLat: number, 
  exactLng: number
): { lat: number; lng: number } {
  return roundCoordinatesForPrivacy(exactLat, exactLng);
}

/**
 * Check if coordinates are within Delhi NCR bounds (approximate)
 * Used for basic validation of coordinate inputs
 */
export function isWithinDelhiNCR(lat: number, lng: number): boolean {
  // Approximate bounds for Delhi NCR
  const bounds = {
    north: 28.9,
    south: 28.0,
    east: 77.5,
    west: 76.8,
  };

  return lat >= bounds.south && 
         lat <= bounds.north && 
         lng >= bounds.west && 
         lng <= bounds.east;
}

/**
 * Get default location for Delhi
 */
export function getDefaultDelhiLocation(): LocationData {
  return {
    locality: '',
    city: 'Delhi',
  };
}