"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";

const ensureThemeMeta = () => {
  const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (meta) return meta;

  const createdMeta = document.createElement("meta");
  createdMeta.name = "theme-color";
  document.head.appendChild(createdMeta);
  return createdMeta;
};

export const useStatusBarColor = () => {
  useEffect(() => {
    // This hook is now only responsible for setting the browser theme-color for PWA context.
    // All native status bar logic is handled by StatusBarManager.tsx and capacitor.config.ts.
    const themeMeta = ensureThemeMeta();
    const headerColor = getComputedStyle(document.documentElement).getPropertyValue('--background') || '#ffffff';
    themeMeta.setAttribute("content", headerColor.trim());

    if (Capacitor.isNativePlatform()) {
      // All native calls have been removed to prevent conflicts with the overlay configuration.
    }
  }, []);
};