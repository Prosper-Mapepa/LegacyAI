"use client";

import { useEffect, useState } from "react";

/** SSR-safe matchMedia hook. Starts false, then updates after mount. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const update = () => setMatches(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [query]);

  return matches;
}

export function useIsMobileLg() {
  return useMediaQuery("(max-width: 1023px)");
}
