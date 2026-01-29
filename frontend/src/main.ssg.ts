/**
 * SSG Entry Point for vite-ssg
 * This file is used when building with SSG (npm run build:ssg)
 */

import { ViteSSG } from 'vite-ssg/single-page'
import App from './App'
import './index.css'

// Routes to pre-render (static pages only)
// Dynamic routes (/spaces/*) will be handled client-side
export const createRoot = ViteSSG(
  App,
  {
    includedRoutes: async () => {
      return [
        '/',
        '/explore',
        '/how-it-works',
        '/trust',
        '/partners',
        '/contact'
      ]
    }
  },
  // Root setup hook (runs once)
  ({ app, router, isClient }) => {
    // Any setup logic here if needed
    if (isClient) {
      // Client-side only setup
    }
  }
)
