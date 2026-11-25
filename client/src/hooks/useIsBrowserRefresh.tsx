import { useRef } from "react";

export function useIsBrowserRefresh(): boolean {
  const isBrowserRefresh = useRef(
    typeof window !== "undefined" &&
      (
        performance.getEntriesByType(
          "navigation"
        )[0] as PerformanceNavigationTiming
      )?.type === "reload"
  );

  return isBrowserRefresh.current;
}
