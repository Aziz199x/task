"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";
import { useTheme } from "next-themes";

const ensureThemeMeta = () => {
  const existing = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (existing) return existing;
  const meta = document.createElement("meta");
  meta.name = "theme-color";
  document.head.appendChild(meta);
  return meta;
};

const hslToHex = (hsl: string | null) => {
  if (!hsl) return null;
  const parts = hsl.split(/\s+/).filter(Boolean);
  if (parts.length < 3) return null;

  const h = parseFloat(parts[0]);
  const s = parseFloat(parts[1].replace("%", "")) / 100;
  const l = parseFloat(parts[2].replace("%", "")) / 100;

  if (Number.isNaN(h) || Number.isNaN(s) || Number.isNaN(l)) return null;

  const hueToRgb = (p: number, q: number, t: number) => {
    let temp = t;
    if (temp < 0) temp += 1;
    if (temp > 1) temp -= 1;
    if (temp < 1 / 6) return p + (q - p) * 6 * temp;
    if (temp < 1 / 2) return q;
    if (temp < 2 / 3) return p + (q - p) * (2 / 3 - temp) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  const r = hueToRgb(p, q, h / 360 + 1 / 3);
  const g = hueToRgb(p, q, h / 360);
  const b = hueToRgb(p, q, h / 360 - 1 / 3);

  const toHex = (value: number) => Math.round(value * 255)
    .toString(16)
    .padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const StatusBarManager = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof window === "undefined" || !resolvedTheme) return;

    const rootStyles = getComputedStyle(document.documentElement);
    const cssVarName = resolvedTheme === "dark" ? "--primary" : "--background";
    const cssValue = rootStyles.getPropertyValue(cssVarName).trim();
    const fallback = resolvedTheme === "dark" ? "#0f172a" : "#ffffff";
    const hexColor = hslToHex(cssValue) ?? fallback;

    const meta = ensureThemeMeta();
    meta.setAttribute("content", hexColor);

    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: resolvedTheme === "dark" ? Style.Light : Style.Dark });
      if (Capacitor.getPlatform() === "android") {
        StatusBar.setBackgroundColor({ color: hexColor });
      }
    }
  }, [resolvedTheme]);

  return null;
};

export default StatusBarManager;