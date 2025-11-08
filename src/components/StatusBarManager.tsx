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
        // Ensure status bar doesn't overlay the webview
        await StatusBar.setOverlaysWebView({ overlay: false });

        if (resolvedTheme === "dark") {
          // Dark theme: dark gray status bar with light icons
          await StatusBar.setBackgroundColor({ color: "#1f2937" });
          await StatusBar.setStyle({ style: Style.Light });
        } else {
          // Light theme: white status bar with dark icons
          await StatusBar.setBackgroundColor({ color: "#ffffff" });
          await StatusBar.setStyle({ style: Style.Dark });
        }
        
        console.log(`[StatusBarManager] Status bar configured for ${resolvedTheme} theme`);
      } catch (error) {
        console.error('[StatusBarManager] Error setting up status bar:', error);
      }
    };

    setupStatusBar();
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;