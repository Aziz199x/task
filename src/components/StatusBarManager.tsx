"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar } from "@capacitor/status-bar";

const StatusBarManager = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupStatusBar = async () => {
      try {
        // Use overlay: true to allow the webview to draw under the status bar.
        // This creates a more immersive, modern look.
        await StatusBar.setOverlaysWebView({ overlay: true });

        // The programmatic setStyle call has been removed.
        // We now rely entirely on the native styles defined in:
        // - android/app/src/main/res/values/styles.xml (for light theme)
        // - android/app/src/main/res/values-night/styles.xml (for dark theme)
        // This avoids conflicts and makes the native configuration the single source of truth.
      } catch (error) {
        console.error("[StatusBarManager] Error setting up status bar:", error);
      }
    };

    setupStatusBar();
  }, []);

  return null;
};

export default StatusBarManager;