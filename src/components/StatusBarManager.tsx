"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useTheme } from "next-themes";

const STATUS_BAR_COLOR = "#111827";

const StatusBarManager = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const setupStatusBar = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: false });

        await StatusBar.setBackgroundColor({ color: STATUS_BAR_COLOR });
        await StatusBar.setStyle({ style: Style.Light });
      } catch (error) {
        console.error('Error setting up status bar:', error);
      }
    };

    setupStatusBar();
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;