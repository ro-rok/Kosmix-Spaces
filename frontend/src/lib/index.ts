/**
 * Core utilities and helpers index
 * Exports all utility functions for easy importing
 */

// Slug utilities
export {
  slugify,
  generateHashSuffix,
  generateSlug,
  resolveSlugCollision,
  parseSlug,
  generatePreviewSlug,
  hasHashSuffix,
} from './slug';

// Price utilities
export {
  formatPrice,
  formatCardPrice,
  getPriceSortValue,
  hasPricing,
  validatePriceData,
  type PriceDisplayProps,
} from './price';

// Validation schemas and utilities
export {
  partnerRegistrationSchema,
  loginSchema,
  leadSchema,
  siteVisitSchema,
  offeringSchema,
  offeringWithPhotosSchema,
  basicListingInfoSchema,
  locationSchema,
  listingSchema,
  listingSubmissionSchema,
  searchFiltersSchema,
  validateField,
  getFieldError,
  type PartnerRegistrationData,
  type LoginData,
  type LeadData,
  type SiteVisitData,
  type OfferingFormData,
  type BasicListingInfoData,
  type ListingFormData,
  type SearchFiltersData,
} from './validation';

// Offering utilities
export {
  createDefaultOffering,
  createDefaultOfferingFormData,
  initializeAllOfferings,
  getEnabledOfferings,
  validateOfferingsForSubmission,
  getTotalPhotoCount,
  getOfferingByType,
  updateOffering,
  toggleOfferingEnabled,
  addPhotoToOffering,
  removePhotoFromOffering,
  reorderOfferingPhotos,
} from './offerings';

// Location utilities
export {
  roundCoordinatesForPrivacy,
  createPublicLocationData,
  formatLocationDisplay,
  getLocationPrivacyDisclaimer,
  validateLocationPrivacy,
  generateApproximateCoordinates,
  isWithinDelhiNCR,
  getDefaultDelhiLocation,
} from './location';

// Re-export existing utilities
export * from './api';
export * from './utils';
export * from './analytics';
export * from './filters';
export * from './shortlist';
export * from './whatsapp';
export * from './constants';
export * from './assets';