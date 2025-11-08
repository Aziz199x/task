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
        // DO NOT use overlay mode - this causes the status bar to blend with the app
        await StatusBar.setOverlaysWebView({ overlay: false });

        // Set background color for the status bar based on theme
        if (resolvedTheme === "dark") {
          // Dark theme: dark background with light icons
          await StatusBar.setBackgroundColor({ color: '#020817' }); // slate-950
          await StatusBar.setStyle({ style: Style.Dark });
        } else {
          // Light theme: light background with dark icons
          await StatusBar.setBackgroundColor({ color: '#ffffff' }); // white
          await StatusBar.setStyle({ style: Style.Light });
        }
        
      } catch (error) {
        console.error('[StatusBarManager] Error setting up status bar:', error);
      }
    };

    setupStatusBar();
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;