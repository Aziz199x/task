"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useTheme } from "next-themes";

const StatusBarManager = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Allow the webview to draw behind the status bar.
    StatusBar.setOverlaysWebView({ overlay: true });

    // Update the status bar icon style based on the theme.
    if (resolvedTheme === "dark") {
      StatusBar.setStyle({ style: Style.Light });
    } else {
      StatusBar.setStyle({ style: Style.Dark });
    }
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;