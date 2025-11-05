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
          // Determine the target style for status bar icons based on the app's theme.
          // If the app is in dark mode, the header is visually dark, so status bar icons should be LIGHT.
          // If the app is in light mode, the header is visually light, so status bar icons should be DARK.
          const targetStyle = theme === 'dark' ? Style.Light : Style.Dark;
          
          await StatusBar.setStyle({ style: targetStyle });
          
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