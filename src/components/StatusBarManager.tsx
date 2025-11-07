"use client";

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { StatusBar, Style } from '@capacitor/status-bar';

const StatusBarManager: React.FC = () => {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    // Use resolvedTheme to ensure we have the final theme (light/dark)
    const currentTheme = resolvedTheme || theme;

    // Check if running in a Capacitor environment
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const updateStatusBar = async () => {
        try {
          // The native theme now handles the color and icon style.
          // This component can be used for other dynamic adjustments if needed in the future.
          // For now, we'll just log the theme for debugging.
          console.log(`[StatusBarManager] Current Theme: ${currentTheme}. Native theme is handling status bar.`);
          
        } catch (e) {
          // Ignore errors if not running on native device
          console.log("Capacitor Status Bar update failed (likely running in browser):", e);
        }
      };

      // Delay slightly to ensure the theme is fully resolved and the webview is ready
      const timeout = setTimeout(updateStatusBar, 100);
      return () => clearTimeout(timeout);
    }
  }, [theme, resolvedTheme]);

  return null;
};

export default StatusBarManager;