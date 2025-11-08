import { useState, useEffect } from "react";

/**
 * A custom hook that tracks whether a media query is met.
 * @param query The media query string to watch.
 * @returns `true` if the media query is met, `false` otherwise.
 */
const useMediaQuery = (query: string) => {
  const [matches, setMatches] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQueryList = window.matchMedia(query);
    
    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // The 'change' event is more efficient than 'resize' for media queries.
    mediaQueryList.addEventListener('change', listener);

    // Clean up the listener on component unmount.
    return () => {
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query]);

  return matches;
};

/**
 * A hook that returns whether the current viewport is "mobile" size (less than 1024px).
 * This is used to toggle between a persistent sidebar and a hamburger menu.
 * It also returns a flag to indicate when the client has loaded to prevent hydration mismatches.
 */
export function useIsMobile() {
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  // The 'lg' breakpoint in Tailwind is 1024px. We consider anything less as "mobile" for layout purposes.
  const isMobile = useMediaQuery('(max-width: 1023px)');

  useEffect(() => {
    // This ensures that we don't have a hydration mismatch between server and client.
    // The component will render with isClientLoaded=false on the server, and then re-render with true on the client.
    setIsClientLoaded(true);
  }, []);

  return { isMobile, isClientLoaded };
}