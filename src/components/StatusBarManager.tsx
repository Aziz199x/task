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
        // Use overlay: true to allow the webview to draw under the status bar.
        // This creates a more immersive, modern look.
        await StatusBar.setOverlaysWebView({ overlay: true });

        // Set the status bar icon style based on the app's theme.
        if (resolvedTheme === "dark") {
          // Dark theme: navbar is dark, so use light icons for contrast.
          await StatusBar.setStyle({ style: Style.Light });
        } else {
          // Light theme: navbar is white, so use dark icons for contrast.
          await StatusBar.setStyle({ style: Style.Dark });
        }
      } catch (error) {
        console.error("[StatusBarManager] Error setting up status bar:", error);
      }
    };

    setupStatusBar();
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;