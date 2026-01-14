/**
 * Asset utilities and constants
 * This file exists to prevent build errors from cached references
 */

// Logo version for cache busting
export const LOGO_VERSION = 'v2';

// Asset paths
export const LOGO_ASSETS = {
  favicon32: `/favicon-32x32.png?${LOGO_VERSION}`,
  favicon16: `/favicon-16x16.png?${LOGO_VERSION}`,
  faviconIco: `/favicon.ico?${LOGO_VERSION}`,
  logo: `/logo.png?${LOGO_VERSION}`,
  appleTouchIcon: `/apple-touch-icon.png?${LOGO_VERSION}`,
} as const;

// Preload logo assets for better UX
export const preloadLogoAssets = () => {
  Object.values(LOGO_ASSETS).forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};
