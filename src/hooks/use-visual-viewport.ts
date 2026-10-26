"use client";

import { useEffect, useState } from "react";

/**
 * Tracks the visual viewport height (shrinks when the mobile keyboard opens)
 * so fixed chat shells can resize without scrolling the page.
 */
export function useVisualViewportHeight(offsetPx = 0) {
  const [height, setHeight] = useState<number | null>(null);

  useEffect(() => {
    const vv = window.visualViewport;

    function update() {
      const h = vv?.height ?? window.innerHeight;
      setHeight(Math.max(0, h - offsetPx));
      // Keep the document pinned so iOS doesn't scroll the page behind the chat.
      if (window.scrollY !== 0) window.scrollTo(0, 0);
    }

    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [offsetPx]);

  return height;
}

/** Approximate site header height on mobile (single row, no secondary nav). */
export const MOBILE_HEADER_OFFSET = 56;
