"use client";

import { isPlatform } from '@capacitor/core';

/**
 * Returns the correct base URL for Supabase redirects, prioritizing the custom
 * Capacitor scheme when running on a native device.
 */
export const getCapacitorBaseUrl = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000'; // Default fallback for SSR/build time
  }

  // Check if running on a native platform (iOS or Android)
  if (isPlatform('capacitor')) {
    // Use the custom URL scheme defined in capacitor.config.ts (com.abumiral.workflow)
    // This must match the scheme configured in your native project and Supabase redirect settings.
    return 'com.abumiral.workflow://';
  }

  // Fallback to standard web origin (Vercel domain or localhost)
  return window.location.origin;
};