"use client";

import { useResponsive } from './use-responsive';

/**
 * Hook to determine if the current screen size is considered 'desktop' (>= 1024px).
 * @returns boolean
 */
const useIsDesktop = (): boolean => {
  const screen = useResponsive();
  return screen === 'desktop';
};

export default useIsDesktop;