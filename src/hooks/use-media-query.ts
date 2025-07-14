'use client';
// https://usehooks.com/usemediaquery
import { useSyncExternalStore, useCallback } from "react";

type MediaQueryType = "mobile" | "desktop";
type MatchMediaType = Record<MediaQueryType, string>;

const MEDIA_QUERIES: MatchMediaType = {
  mobile: "only screen and (max-width : 640px)",
  desktop: "only screen and (max-width : 1200px)",
};

export function useMediaQuery(type: MediaQueryType, query?: string) {

  const subscribe = useCallback(
    (callback: () => void) => {
      const matchMedia = window.matchMedia(MEDIA_QUERIES[type]);

      matchMedia.addEventListener("change", callback);
      return () => {
        matchMedia.removeEventListener("change", callback);
      };
    },
    [type],
  );

  const getSnapshot = useCallback(() => {
    return window.matchMedia(MEDIA_QUERIES[type] || query!).matches;
  }, [type, query]);

  const getServerSnapshot = () => {
    // Return false by default for SSR to assume desktop
    return false;
  };

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
