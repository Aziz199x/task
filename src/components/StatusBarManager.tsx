"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

const StatusBarManager = () => {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    StatusBar.setOverlaysWebView({ overlay: false });
    StatusBar.setBackgroundColor({ color: "#ffffff" });
    StatusBar.setStyle({ style: Style.Dark });
  }, []);

  return null;
};

export default StatusBarManager;