"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useTheme } from "next-themes";

const StatusBarManager = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });

        // Set the status bar icon style based on the app's theme.
        // A small timeout helps ensure this runs after the theme has been fully applied,
        // preventing race conditions where the icon style is set before the background color changes.
        setTimeout(() => {
          if (resolvedTheme === "dark") {
            // Dark theme gets light icons for contrast.
            StatusBar.setStyle({ style: Style.Light });
          } else {
            // Light theme gets dark icons for contrast.
            StatusBar.setStyle({ style: Style.Dark });
          }
        }, 150); // A 150ms delay is usually enough to avoid race conditions.
        
      } catch (error) {
        console.error('[StatusBarManager] Error setting up status bar:', error);
      }
    };

    setupStatusBar();
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;