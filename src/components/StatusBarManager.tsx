"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useTheme } from "next-themes";

const StatusBarManager = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // This effect runs once when the app starts.
    if (Capacitor.isNativePlatform()) {
      // Create a solid separation between the status bar and the app.
      StatusBar.setOverlaysWebView({ overlay: false });
    }
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    if (resolvedTheme === "dark") {
      // Set status bar for dark mode
      StatusBar.setBackgroundColor({ color: "#020817" }); // Dark background from globals.css
      StatusBar.setStyle({ style: Style.Light }); // Light icons for dark background
    } else {
      // Set status bar for light mode
      StatusBar.setBackgroundColor({ color: "#FFFFFF" }); // White background
      StatusBar.setStyle({ style: Style.Dark }); // Dark icons for light background
    }
  }, [resolvedTheme]); // Re-run this effect when the theme changes

  return null;
};

export default StatusBarManager;