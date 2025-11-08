"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

const STATUS_BAR_COLOR = "#FF7A00";

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
    const themeMeta = ensureThemeMeta();
    themeMeta.setAttribute("content", STATUS_BAR_COLOR);

    if (!Capacitor.isNativePlatform()) return;

    StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);

    if (Capacitor.getPlatform() === "android") {
      StatusBar.setBackgroundColor({ color: STATUS_BAR_COLOR }).catch(() => undefined);
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);
    } else if (Capacitor.getPlatform() === "ios") {
      StatusBar.setOverlaysWebView({ overlay: false }).catch(() => undefined);
    }
  }, []);
};