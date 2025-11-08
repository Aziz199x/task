"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useTheme } from "next-themes";

const StatusBarManager = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    void StatusBar.setOverlaysWebView({ overlay: true });
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!resolvedTheme) return;

    const style = resolvedTheme === "dark" ? Style.Light : Style.Dark;

    void StatusBar.setStyle({ style });
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;