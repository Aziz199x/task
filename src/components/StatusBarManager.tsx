"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

const StatusBarManager = () => {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      // Your app's header is always dark, so the status bar icons must always be light.
      StatusBar.setStyle({ style: Style.Light });
    }
  }, []); // This only needs to run once.

  return null;
};

export default StatusBarManager;