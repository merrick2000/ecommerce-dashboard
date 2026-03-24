"use client";

import { useEffect, useRef, useCallback } from "react";
import { sendTrackEvent } from "@/lib/api";

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let sid = sessionStorage.getItem("_slt_sid");
  if (!sid) {
    sid = crypto.randomUUID?.() || Math.random().toString(36).slice(2) + Date.now().toString(36);
    sessionStorage.setItem("_slt_sid", sid);
  }
  return sid;
}

function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  // Cache UTMs for the session
  const cached = sessionStorage.getItem("_slt_utm");
  if (cached) return JSON.parse(cached);

  const params = new URLSearchParams(window.location.search);
  const utm: Record<string, string> = {};
  for (const key of ["utm_source", "utm_medium", "utm_campaign"]) {
    const val = params.get(key);
    if (val) utm[key] = val;
  }
  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem("_slt_utm", JSON.stringify(utm));
  }
  return utm;
}

export function usePageTracking(storeId: number, productId?: number) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;

    sendTrackEvent({
      store_id: storeId,
      product_id: productId,
      event_type: "page_view",
      session_id: getSessionId(),
      referrer: document.referrer || undefined,
      ...getUtmParams(),
    });
  }, [storeId, productId]);

  const trackEvent = useCallback(
    (eventType: string, overrideProductId?: number) => {
      sendTrackEvent({
        store_id: storeId,
        product_id: overrideProductId ?? productId,
        event_type: eventType,
        session_id: getSessionId(),
        ...getUtmParams(),
      });
    },
    [storeId, productId]
  );

  return { trackEvent };
}
