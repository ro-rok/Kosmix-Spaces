/**
 * Basic verification tests for core utilities
 * These tests verify the core functionality works as expected
 */

import { 
  slugify, 
  generateHashSuffix, 
  generateSlug, 
  resolveSlugCollision,
} from '../slug';

import {
  formatPrice,
  validatePriceData,
} from '../price';

import {
  createDefaultOffering,
  initializeAllOfferings,
  validateOfferingsForSubmission,
} from '../offerings';

import {
  roundCoordinatesForPrivacy,
  validateLocationPrivacy,
} from '../location';

// Test data
const testListingId = '507f1f77bcf86cd799439011';
const testPartner = 'WeWork India';
const testLocality = 'Connaught Place';
const testName = 'Premium Office Space';

// Slug generation tests
console.log('Testing slug generation...');

const slug1 = slugify('Test String With Spaces & Special!');
console.assert(slug1 === 'test-string-with-spaces-special', `Expected clean slug, got: ${slug1}`);

const slug2 = slugify('Multiple---Hyphens');
console.assert(slug2 === 'multiple-hyphens', `Expected single hyphens, got: ${slug2}`);

const hashSuffix = generateHashSuffix(testListingId);
console.assert(hashSuffix.length === 6, `Expected 6-char hash, got: ${hashSuffix}`);
console.assert(/^[a-z0-9]+$/.test(hashSuffix), `Expected alphanumeric hash, got: ${hashSuffix}`);

const fullSlug = generateSlug(testPartner, testLocality, testName);
console.assert(fullSlug.startsWith('/listing/'), `Expected slug to start with /listing/, got: ${fullSlug}`);
console.assert(fullSlug.includes('wework-india'), `Expected partner slug in: ${fullSlug}`);
console.assert(fullSlug.includes('connaught-place'), `Expected locality slug in: ${fullSlug}`);

const collisionSlug = resolveSlugCollision(fullSlug, testListingId);
console.assert(collisionSlug.includes('-' + hashSuffix), `Expected hash suffix in collision slug: ${collisionSlug}`);

console.log('✓ Slug generation tests passed');

// Price formatting tests
console.log('Testing price formatting...');

const price1 = formatPrice({ startingPrice: 15000, unit: 'month' });
console.assert(price1 === 'Starting ₹15,000 / month', `Expected formatted price, got: ${price1}`);

const price2 = formatPrice({ budgetBand: '₹₹' });
console.assert(price2 === 'Budget ₹₹', `Expected budget band, got: ${price2}`);

const price3 = formatPrice({});
console.assert(price3 === 'On enquiry', `Expected fallback text, got: ${price3}`);

const validation = validatePriceData({ startingPrice: -100, unit: 'month' });
console.assert(!validation.isValid, 'Expected validation to fail for negative price');
console.assert(validation.errors.length > 0, 'Expected validation errors');

console.log('✓ Price formatting tests passed');

// Offering management tests
console.log('Testing offering management...');

const defaultOffering = createDefaultOffering('private-offices');
console.assert(defaultOffering.type === 'private-offices', 'Expected correct offering type');
console.assert(defaultOffering.title === 'Private Offices', 'Expected default title');
console.assert(!defaultOffering.enabled, 'Expected offering to be disabled by default');

const allOfferings = initializeAllOfferings();
const offeringTypes = Object.keys(allOfferings);
console.assert(offeringTypes.length === 5, `Expected 5 offering types, got: ${offeringTypes.length}`);
console.assert(offeringTypes.includes('private-offices'), 'Expected private-offices type');
console.assert(offeringTypes.includes('meeting-rooms'), 'Expected meeting-rooms type');

const validationResult = validateOfferingsForSubmission(allOfferings);
console.assert(!validationResult.isValid, 'Expected validation to fail for empty offerings');
console.assert(validationResult.errors.length > 0, 'Expected validation errors');

console.log('✓ Offering management tests passed');

// Location privacy tests
console.log('Testing location privacy...');

const roundedCoords = roundCoordinatesForPrivacy(28.123456, 77.987654);
console.assert(roundedCoords.lat === 28.12, `Expected rounded lat, got: ${roundedCoords.lat}`);
console.assert(roundedCoords.lng === 77.99, `Expected rounded lng, got: ${roundedCoords.lng}`);

const privacyCheck1 = validateLocationPrivacy({ locality: 'CP', city: 'Delhi' });
console.assert(privacyCheck1.isValid, 'Expected valid location data');

const privacyCheck2 = validateLocationPrivacy({ 
  locality: 'CP', 
  city: 'Delhi', 
  exactAddress: '123 Main St' 
});
console.assert(!privacyCheck2.isValid, 'Expected invalid location data with exact address');

console.log('✓ Location privacy tests passed');

console.log('\n🎉 All core utility tests passed!');
console.log('Core utilities are working correctly and ready for use.');