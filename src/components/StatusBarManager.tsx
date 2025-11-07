"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

const StatusBarManager = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    // This ensures the web view is not drawn under the status bar
    StatusBar.setOverlaysWebView({ overlay: false });

    // Set the status bar background to a dark color
    StatusBar.setBackgroundColor({ color: "#1F1F1F" }); 

    // Use light text for the status bar
    StatusBar.setStyle({ style: Style.Light });
  }, []);

  return null;
};

export default StatusBarManager;
