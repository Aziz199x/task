"use client";

import { useEffect } from 'react';
import { useTheme } from 'next-themes';
import { StatusBar, Style } from '@capacitor/status-bar';

const StatusBarManager: React.FC = () => {
  const { theme } = useTheme();

  useEffect(() => {
    // Check if running in a Capacitor environment
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      const updateStatusBar = async () => {
        try {
          // Determine the header background color based on the theme logic in globals.css
          // Light Theme: --primary is dark -> Header is dark. Status bar icons should be LIGHT.
          // Dark Theme: --primary is light -> Header is light. Status bar icons should be DARK.
          
          const targetStyle = theme === 'dark' ? Style.Dark : Style.Light;
          
          await StatusBar.setStyle({ style: targetStyle });
          
          // Optional: Set the background color to match the header's primary color
          // Note: We rely on the native config for the initial background, but setting it here ensures consistency.
          // Since the header is always bg-primary, we can't easily read the HSL value here, 
          // but setting the style (icon color) is the critical fix.
          
        } catch (e) {
          // Ignore errors if not running on native device
          console.log("Capacitor Status Bar update failed (likely running in browser):", e);
        }
      };

      updateStatusBar();
    }
  }, [theme]);

  return null;
};

export default StatusBarManager;