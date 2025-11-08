import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  // isMobile: actual state based on screen size
  // isClientLoaded: true once useEffect has run (i.e., we are client-side and window is available)
  const [state, setState] = React.useState<{ isMobile: boolean; isClientLoaded: boolean }>({
    isMobile: false,
    isClientLoaded: false,
  });

  React.useEffect(() => {
    const checkMobile = () => {
      // Consider landscape phones (short height) as mobile too
      const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT;
      const isMobileHeight = window.innerHeight < 480; // landscape phones often have small height
      setState({
        isMobile: isMobileWidth || isMobileHeight,
        isClientLoaded: true,
      });
    };

    // Set initial value and mark as loaded
    checkMobile();

    // Listen to viewport changes
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);

    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  return state;
}