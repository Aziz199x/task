import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [state, setState] = React.useState<{
    isMobile: boolean;
    isLandscape: boolean;
    isClientLoaded: boolean;
  }>({
    isMobile: false,
    isLandscape: false,
    isClientLoaded: false,
  });

  React.useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT;
      const isMobileHeight = window.innerHeight < 480;
      const isLandscape =
        (window.matchMedia && window.matchMedia("(orientation: landscape)").matches) ||
        window.innerWidth > window.innerHeight;

      setState({
        isMobile: isMobileWidth || isMobileHeight,
        isLandscape,
        isClientLoaded: true,
      });
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  return state;
}