import React from 'react';

// Safe wrapper for Vercel Analytics that handles errors gracefully
export function SafeAnalytics() {
  try {
    // Dynamically import to avoid blocking errors
    const { Analytics } = require('@vercel/analytics/react');
    return <Analytics />;
  } catch (error) {
    // Silently fail if analytics can't load (e.g., blocked by ad blocker)
    console.debug('Analytics not loaded:', error);
    return null;
  }
}

// Safe wrapper for Vercel Speed Insights that handles errors gracefully
export function SafeSpeedInsights() {
  try {
    // Dynamically import to avoid blocking errors
    const { SpeedInsights } = require('@vercel/speed-insights/react');
    return <SpeedInsights />;
  } catch (error) {
    // Silently fail if speed insights can't load (e.g., blocked by ad blocker)
    console.debug('Speed Insights not loaded:', error);
    return null;
  }
}
