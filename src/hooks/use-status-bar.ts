"use client";

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { useTheme } from 'next-themes';

const STATUS_BAR_COLOR = '#FF7A00';

export const useStatusBarManager = () => {
  const { theme } = useTheme();

  useEffect(() => {
    const setStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) {
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', STATUS_BAR_COLOR);
        return;
      }

      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: STATUS_BAR_COLOR });
        
        // Use Dark icons on light backgrounds, Light icons on dark backgrounds
        // Our status bar is always orange, which is a light background.
        // So we always want dark icons.
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (error) {
        console.error('Failed to set status bar style:', error);
      }
    };

    void setStatusBar();
  }, [theme]); // Rerun when theme changes
};