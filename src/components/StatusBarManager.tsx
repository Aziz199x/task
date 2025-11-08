"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useTheme } from "next-themes";

const StatusBarManager = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // This is the most important part.
    // 'overlay: false' tells the system to NOT let your app draw under the status bar.
    // This creates the solid separation you want.
    StatusBar.setOverlaysWebView({ overlay: false });

  }, []); // This part only needs to run once.

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || !resolvedTheme) return;

    // This part runs every time the theme changes.
    if (resolvedTheme === "dark") {
      // --- Dark Mode ---
      // Background: A visible gray, not pure black.
      // Icons: Light icons, so they are visible on the gray background.
      StatusBar.setBackgroundColor({ color: "#424242" });
      StatusBar.setStyle({ style: Style.Light });
    } else {
      // --- Light Mode ---
      // Background: A light gray, not pure white.
      // Icons: Dark icons, so they are visible on the gray background.
      StatusBar.setBackgroundColor({ color: "#F5F5F5" });
      StatusBar.setStyle({ style: Style.Dark });
    }
  }, [resolvedTheme]); // Re-runs when the theme changes.

  return null;
};

export default StatusBarManager;