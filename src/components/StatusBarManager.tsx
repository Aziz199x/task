"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useTheme } from "next-themes";

const StatusBarManager = () => {
  // Use the 'resolvedTheme' to know if the current theme is light or dark,
  // even if the user has selected "system".
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // This ensures the web view is not drawn under the status bar.
    // We only need to set this once.
    StatusBar.setOverlaysWebView({ overlay: false });
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !resolvedTheme) {
      return;
    }

    // Update status bar style whenever the theme changes.
    if (resolvedTheme === "dark") {
      // Dark theme: Dark background, light text
      StatusBar.setBackgroundColor({ color: "#1F1F1F" }); // Or your specific dark theme background color
      StatusBar.setStyle({ style: Style.Light });
    } else {
      // Light theme: Light background, dark text
      StatusBar.setBackgroundColor({ color: "#ffffff" }); // Or your specific light theme background color
      StatusBar.setStyle({ style: Style.Dark });
    }
  }, [resolvedTheme]); // This effect re-runs when the theme changes

  return null;
};

export default StatusBarManager;