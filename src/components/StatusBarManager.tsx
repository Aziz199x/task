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
        // Make the status bar overlay the webview for a modern, seamless UI
        await StatusBar.setOverlaysWebView({ overlay: true });

        // Set the status bar icon style based on the app's theme for proper contrast
        if (resolvedTheme === "dark") {
          // Dark theme gets light icons
          await StatusBar.setStyle({ style: Style.Light });
        } else {
          // Light theme gets dark icons
          await StatusBar.setStyle({ style: Style.Dark });
        }
        
        console.log(`[StatusBarManager] Overlay enabled. Style set for ${resolvedTheme} theme.`);
      } catch (error) {
        console.error('[StatusBarManager] Error setting up status bar:', error);
      }
    };

    setupStatusBar();
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;