"use client";

import { useEffect } from "react";

export function ClarityProvider() {
  useEffect(() => {
    const id = process.env.NEXT_PUBLIC_CLARITY_ID;

    if (!id || process.env.NODE_ENV !== "production") return;

    // Microsoft Clarity script
    (function (c: any, l: any, a: any, r: string, i: string) {
      c[a] =
        c[a] ||
        function () {
          (c[a].q = c[a].q || []).push(arguments);
        };
      const t = l.createElement(r) as HTMLScriptElement;
      t.async = true;
      t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0];
      y.parentNode?.insertBefore(t, y);
    })(window, document, "clarity", "script", id);
  }, []);

  return null;
}
