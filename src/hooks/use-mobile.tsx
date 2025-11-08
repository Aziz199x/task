import * as React from "react";

/**
 * A function to determine if the device is a mobile phone.
 * This check is designed to be stable and not change on orientation change.
 * It primarily relies on the user agent string, which is a reliable indicator for phones.
 */
const isMobileDevice = () => {
  if (typeof window === 'undefined') {
    return false;
  }
  // The 'Mobi' token in the user agent is a de-facto standard for identifying mobile phones.
  // This is more reliable than checking screen width, which can change with orientation.
  return /Mobi/i.test(window.navigator.userAgent);
};

/**
 * A hook that returns whether the current device is a mobile phone.
 * The result is determined once and does not change, preventing layout shifts
 * when the device is rotated or the window is resized.
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
    // We check the device type once on the client-side.
    // A device doesn't change from a phone to a desktop, so this value is stable.
    setState({
      isMobile: isMobileDevice(),
      isClientLoaded: true,
    });
  }, []);

  return state;
}