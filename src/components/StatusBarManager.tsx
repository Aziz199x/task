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
        await StatusBar.setOverlaysWebView({ overlay: false });

        if (resolvedTheme === "dark") {
          await StatusBar.setBackgroundColor({ color: '#1a1a1a' });
          // Light icons/text on dark background
          await StatusBar.setStyle({ style: Style.Light });
        } else {
          // Darker gray for better contrast with white background
          await StatusBar.setBackgroundColor({ color: '#e0e0e0' });
          // Dark icons/text on light background
          await StatusBar.setStyle({ style: Style.Dark });
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