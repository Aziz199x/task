"use client";

import { Capacitor } from '@capacitor/core';
import { APP_URL, DEEP_LINK_SCHEME } from './constants';

/**
 * Returns the correct base URL for Supabase redirects, prioritizing the custom
 * Capacitor scheme when running on a native device.
 */
export const getCapacitorBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return APP_URL; // Default fallback for SSR/build time
  }

  // Check if running on a native platform (iOS or Android)
  if (Capacitor.isNativePlatform()) {
    // Use the custom URL scheme defined in capacitor.config.ts (com.abumiral.workflow)
    // This must match the scheme configured in your native project and Supabase redirect settings.
    return `${DEEP_LINK_SCHEME}://auth/callback`;
  }

  // Fallback to standard web origin (Vercel domain or localhost)
  return `${APP_URL}/auth/callback`;
};