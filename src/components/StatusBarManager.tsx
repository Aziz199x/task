"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useTheme } from "next-themes";

const StatusBarManager = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // This ensures the web view is not drawn under the status bar.
    // It runs once when the component is first loaded.
    if (Capacitor.isNativePlatform()) {
      StatusBar.setOverlaysWebView({ overlay: false });
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !resolvedTheme) {
      return;
    }

    // This logic now runs every time the theme changes.
    if (resolvedTheme === "dark") {
      // Dark Theme: Use a noticeable gray background with light text/icons.
      StatusBar.setBackgroundColor({ color: "#424242" });
      StatusBar.setStyle({ style: Style.Light });
    } else {
      // Light Theme: Use a light-gray background with dark text/icons.
      StatusBar.setBackgroundColor({ color: "#E0E0E0" });
      StatusBar.setStyle({ style: Style.Dark });
    }
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;