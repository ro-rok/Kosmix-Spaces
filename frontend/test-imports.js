// Simple Node.js script to test animation library imports
// This tests that the packages are installed correctly

console.log('Testing animation library imports...\n');

try {
  // Test Lenis
  const lenis = require('lenis');
  console.log('✅ Lenis imported successfully');
  console.log('   Type:', typeof lenis);
  console.log('   Default export:', typeof lenis.default);
} catch (error) {
  console.log('❌ Lenis import failed:', error.message);
}

try {
  // Test Framer Motion
  const framerMotion = require('framer-motion');
  console.log('✅ Framer Motion imported successfully');
  console.log('   motion:', typeof framerMotion.motion);
  console.log('   AnimatePresence:', typeof framerMotion.AnimatePresence);
} catch (error) {
  console.log('❌ Framer Motion import failed:', error.message);
}

try {
  // Test GSAP
  const gsap = require('gsap');
  console.log('✅ GSAP imported successfully');
  console.log('   gsap:', typeof gsap.gsap);
  console.log('   default:', typeof gsap.default);
} catch (error) {
  console.log('❌ GSAP import failed:', error.message);
}

try {
  // Test GSAP ScrollTrigger
  const scrollTrigger = require('gsap/ScrollTrigger');
  console.log('✅ GSAP ScrollTrigger imported successfully');
  console.log('   ScrollTrigger:', typeof scrollTrigger.ScrollTrigger);
} catch (error) {
  console.log('❌ GSAP ScrollTrigger import failed:', error.message);
}

console.log('\n✅ Animation library installation test completed!');