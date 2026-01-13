// Logo and asset constants
// This ensures proper bundling and deployment on Vercel

// Cache buster version - increment this when updating logos
const LOGO_VERSION = 'v2';

// For development and production, we'll use public assets with fallbacks
export const LOGO_ASSETS = {
  // Primary logo (32x32 favicon)
  favicon32: `/favicon-32x32.png?${LOGO_VERSION}`,
  // 16x16 favicon
  favicon16: `/favicon-16x16.png?${LOGO_VERSION}`,
  // Fallback to favicon.ico if PNG fails
  faviconIco: `/favicon.ico?${LOGO_VERSION}`,
  // Main logo
  logo: `/logo.png?${LOGO_VERSION}`,
  // Apple touch icon as fallback
  appleTouchIcon: `/apple-touch-icon.png?${LOGO_VERSION}`,
} as const;

// Helper function to get logo with fallback
export function getLogoSrc(preferredSize: 'small' | 'medium' | 'large' = 'small'): string {
  switch (preferredSize) {
    case 'small':
      return LOGO_ASSETS.favicon32;
    case 'medium':
      return LOGO_ASSETS.logo;
    case 'large':
      return LOGO_ASSETS.logo;
    default:
      return LOGO_ASSETS.favicon32;
  }
}

// Helper function to preload logo assets
export function preloadLogoAssets(): void {
  const assets = Object.values(LOGO_ASSETS);
  assets.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
}