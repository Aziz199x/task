"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

const StatusBarManager = () => {
  useEffect(() => {
    // This effect runs once when the app starts.
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // 1. Create a solid separation between the status bar and the app.
    StatusBar.setOverlaysWebView({ overlay: false });

    // 2. Set the status bar background color to white, ALWAYS.
    StatusBar.setBackgroundColor({ color: "#FFFFFF" });

    // 3. Set the status bar icons to be dark, ALWAYS.
    StatusBar.setStyle({ style: Style.Dark });

  }, []); // The empty array [] ensures this code only runs ONCE.

  return null;
};

export default StatusBarManager;