import * as React from "react";

/**
 * Determines if the device is a mobile phone using multiple detection methods.
 * This check is stable and does not change on orientation change.
 */
const isMobileDevice = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  
  // Method 1: Check user agent for mobile indicators
  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
  const hasMobileKeyword = mobileKeywords.some(keyword => userAgent.includes(keyword));
  
  // Method 2: Check for touch support (mobile devices have touch)
  const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  
  // Method 3: Check screen size (but use the smaller dimension to handle rotation)
  const smallerDimension = Math.min(window.screen.width, window.screen.height);
  const isSmallScreen = smallerDimension < 768;
  
  // A device is mobile if it has mobile keywords OR (has touch AND small screen)
  return hasMobileKeyword || (hasTouch && isSmallScreen);
};

/**
 * Hook that returns whether the current device is a mobile phone.
 * The result is determined once and remains stable across orientation changes.
 */
export function useIsMobile() {
  const [state, setState] = React.useState<{
    isMobile: boolean;
    isClientLoaded: boolean;
  }>({
    isMobile: false,
    isClientLoaded: false,
  });

  React.useEffect(() => {
    // Check device type once on mount - this value stays stable
    const isMobile = isMobileDevice();
    
    setState({
      isMobile,
      isClientLoaded: true,
    });
    
    // Log for debugging
    console.log('[useIsMobile] Device detected as:', isMobile ? 'MOBILE' : 'DESKTOP');
  }, []);

  return state;
}