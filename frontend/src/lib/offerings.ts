/**
 * Offering management utilities
 */

import { OfferingType, OfferingData, OfferingFormData, defaultOfferingTitles, PhotoData } from '@/types/models';

/**
 * Create default offering data for a given type
 */
export function createDefaultOffering(type: OfferingType): OfferingData {
  return {
    type,
    title: defaultOfferingTitles[type],
    description: '',
    features: [],
    photos: [],
    enabled: false,
    capacity: {
      min: 1,
      max: getDefaultMaxCapacity(type)
    }
  };
}

/**
 * Get default max capacity based on offering type
 */
function getDefaultMaxCapacity(type: OfferingType): number {
  switch (type) {
    case 'private-offices':
      return 20;
    case 'dedicated-desks':
      return 50;
    case 'hot-desks':
      return 100;
    case 'meeting-rooms':
      return 12;
    case 'event-spaces':
      return 200;
    default:
      return 10;
  }
}

/**
 * Create default offering form data with upload progress tracking
 */
export function createDefaultOfferingFormData(type: OfferingType): OfferingFormData {
  return {
    ...createDefaultOffering(type),
    uploadProgress: {},
  };
}

/**
 * Initialize all 5 offering types with default data
 */
export function initializeAllOfferings(): Record<OfferingType, OfferingFormData> {
  const offeringTypes: OfferingType[] = [
    'private-offices',
    'dedicated-desks', 
    'hot-desks',
    'meeting-rooms',
    'event-spaces'
  ];

  return offeringTypes.reduce((acc, type) => {
    acc[type] = createDefaultOfferingFormData(type);
    return acc;
  }, {} as Record<OfferingType, OfferingFormData>);
}

/**
 * Get enabled offerings from a offerings record
 */
export function getEnabledOfferings(offerings: Record<OfferingType, OfferingData>): OfferingData[] {
  return Object.values(offerings).filter(offering => offering.enabled);
}

/**
 * Check if offerings meet submission requirements
 * Each enabled offering must have at least 1 photo, description, and capacity
 */
export function validateOfferingsForSubmission(offerings: Record<OfferingType, OfferingData>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const enabledOfferings = getEnabledOfferings(offerings);
  
  if (enabledOfferings.length === 0) {
    errors.push('At least one offering must be enabled');
  }
  
  enabledOfferings.forEach(offering => {
    if (!offering.photos || offering.photos.length === 0) {
      errors.push(`${offering.title} must have at least 1 photo`);
    }
    if (!offering.description?.trim()) {
      errors.push(`${offering.title} must have a description`);
    }
    if (!offering.capacity?.min || !offering.capacity?.max) {
      errors.push(`${offering.title} must have capacity information`);
    }
    if (offering.capacity?.min && offering.capacity?.max && offering.capacity.min > offering.capacity.max) {
      errors.push(`${offering.title} min capacity cannot be greater than max capacity`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get total photo count across all offerings
 */
export function getTotalPhotoCount(offerings: Record<OfferingType, OfferingData>): number {
  return Object.values(offerings).reduce((total, offering) => {
    return total + (offering.photos?.length || 0);
  }, 0);
}

/**
 * Get offering by type with type safety
 */
export function getOfferingByType(
  offerings: Record<OfferingType, OfferingData>, 
  type: OfferingType
): OfferingData {
  return offerings[type];
}

/**
 * Update offering in offerings record immutably
 */
export function updateOffering(
  offerings: Record<OfferingType, OfferingData>,
  type: OfferingType,
  updates: Partial<OfferingData>
): Record<OfferingType, OfferingData> {
  return {
    ...offerings,
    [type]: {
      ...offerings[type],
      ...updates,
    },
  };
}

/**
 * Toggle offering enabled state
 */
export function toggleOfferingEnabled(
  offerings: Record<OfferingType, OfferingData>,
  type: OfferingType
): Record<OfferingType, OfferingData> {
  return updateOffering(offerings, type, {
    enabled: !offerings[type].enabled,
  });
}

/**
 * Add photo to offering
 */
export function addPhotoToOffering(
  offerings: Record<OfferingType, OfferingData>,
  type: OfferingType,
  photo: PhotoData
): Record<OfferingType, OfferingData> {
  const currentPhotos = offerings[type].photos || [];
  return updateOffering(offerings, type, {
    photos: [...currentPhotos, photo],
  });
}

/**
 * Remove photo from offering
 */
export function removePhotoFromOffering(
  offerings: Record<OfferingType, OfferingData>,
  type: OfferingType,
  photoPublicId: string
): Record<OfferingType, OfferingData> {
  const currentPhotos = offerings[type].photos || [];
  return updateOffering(offerings, type, {
    photos: currentPhotos.filter(photo => photo.publicId !== photoPublicId),
  });
}

/**
 * Reorder photos in offering
 */
export function reorderOfferingPhotos(
  offerings: Record<OfferingType, OfferingData>,
  type: OfferingType,
  fromIndex: number,
  toIndex: number
): Record<OfferingType, OfferingData> {
  const currentPhotos = [...(offerings[type].photos || [])];
  const [movedPhoto] = currentPhotos.splice(fromIndex, 1);
  currentPhotos.splice(toIndex, 0, movedPhoto);
  
  return updateOffering(offerings, type, {
    photos: currentPhotos,
  });
}