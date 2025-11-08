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
        // Set status bar to NOT overlay the webview - this prevents overlap
        await StatusBar.setOverlaysWebView({ overlay: false });

        // Set background color and style based on theme with distinct colors
        if (resolvedTheme === "dark") {
          // Dark theme: Use a slightly lighter dark color for visibility
          await StatusBar.setBackgroundColor({ color: '#1a1a1a' }); // Lighter dark background
          await StatusBar.setStyle({ style: Style.Dark }); // Light icons/text
        } else {
          // Light theme: Use a light gray instead of pure white for better visibility
          await StatusBar.setBackgroundColor({ color: '#f5f5f5' }); // Light gray background
          await StatusBar.setStyle({ style: Style.Light }); // Dark icons/text
        }
      } catch (error) {
        console.error('Error setting up status bar:', error);
      }
    };

    setupStatusBar();
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;