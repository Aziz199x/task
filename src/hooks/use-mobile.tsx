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
      setState(prev => ({
        ...prev,
        isMobile: window.innerWidth < MOBILE_BREAKPOINT,
        isClientLoaded: true,
      }));
    };
    
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", checkMobile);
    
    // Set initial value and mark as loaded
    checkMobile();
    
    return () => mql.removeEventListener("change", checkMobile);
  }, []);

  return state;
}