"use client";

import { useState, useEffect } from 'react';

type ScreenSize = 'mobile' | 'tablet' | 'desktop';

const getScreenSize = (): ScreenSize => {
  if (typeof window === 'undefined') return 'mobile';
  if (window.matchMedia("(min-width: 1024px)").matches) return 'desktop';
  if (window.matchMedia("(min-width: 768px)").matches) return 'tablet';
  return 'mobile';
};

export const useResponsive = (): ScreenSize => {
  const [screen, setScreen] = useState<ScreenSize>(getScreenSize());

  useEffect(() => {
    const handler = () => setScreen(getScreenSize());
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return screen;
};