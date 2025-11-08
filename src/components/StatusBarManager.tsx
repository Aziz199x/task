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

        // Set background color based on theme
        if (resolvedTheme === "dark") {
          // Dark theme: dark status bar background with light icons
          await StatusBar.setBackgroundColor({ color: '#0a0a0a' }); // Dark background
          await StatusBar.setStyle({ style: Style.Dark }); // Light icons
        } else {
          // Light theme: light status bar background with dark icons
          await StatusBar.setBackgroundColor({ color: '#ffffff' }); // White background
          await StatusBar.setStyle({ style: Style.Light }); // Dark icons
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