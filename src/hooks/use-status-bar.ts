"use client";

import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

const STATUS_BAR_COLOR = '#FF7A00';

export const useStatusBarManager = () => {
  useEffect(() => {
    const setStatusBar = async () => {
      if (!Capacitor.isNativePlatform()) {
        document.querySelector('meta[name="theme-color"]')?.setAttribute('content', STATUS_BAR_COLOR);
        return;
      }

      try {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: STATUS_BAR_COLOR });
        await StatusBar.setStyle({ style: Style.Light }); // Use light content (white icons) on the orange background
      } catch (error) {
        console.error('Failed to set status bar style:', error);
      }
    };

    void setStatusBar();
  }, []);
};