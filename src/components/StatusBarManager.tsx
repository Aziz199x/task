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
          // If the app is in dark mode, the header is visually dark, so status bar icons should be LIGHT.
          // If the app is in light mode, the header is visually light, so status bar icons should be DARK.
          const targetStyle = currentTheme === 'dark' ? Style.Light : Style.Dark;
          
          // Set the background color to match the app's primary color for the current theme
          // In dark mode, the primary color is a dark gray. In light mode, it's white.
          const targetColor = currentTheme === 'dark' ? '#1e293b' : '#ffffff';
          
          console.log(`[StatusBarManager] Current Theme: ${currentTheme}, Applying Style: ${targetStyle === Style.Light ? 'Light Icons' : 'Dark Icons'}, Color: ${targetColor}`);
          
          // Set the background color and style
          await StatusBar.setBackgroundColor({ color: targetColor });
          await StatusBar.setStyle({ style: targetStyle });

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