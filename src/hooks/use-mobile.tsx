import * as React from "react";

const MOBILE_BREAKPOINT = 768; // Devices wider than this are considered tablets/desktops

export function useIsMobile() {
  const [state, setState] = React.useState<{
    isMobile: boolean;
    isClientLoaded: boolean;
  }>({
    isMobile: false,
    isClientLoaded: false,
  });

  React.useEffect(() => {
    const checkDeviceType = () => {
      // This check is now based only on width, making it stable on orientation change
      const isMobileDevice = window.innerWidth < MOBILE_BREAKPOINT;
      
      setState({
        isMobile: isMobileDevice,
        isClientLoaded: true,
      });
    };

    checkDeviceType();
    // We only need to check on resize, not orientation change, as width is our source of truth
    window.addEventListener("resize", checkDeviceType);
    return () => {
      window.removeEventListener("resize", checkDeviceType);
    };
  }, []);

  return state;
}