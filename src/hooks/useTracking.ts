"use client";

import { useEffect, useCallback, useRef } from "react";
import type { TrackingConfig } from "@/lib/api";

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
    ttq?: any;
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function initFacebookPixel(pixelId: string) {
  if (typeof window === "undefined" || window.fbq) return;

  // Standard Facebook Pixel snippet (minified)
  const fbq = function (...args: unknown[]) {
    (fbq as any).callMethod
      ? (fbq as any).callMethod(...args)
      : (fbq as any).queue.push(args);
  } as any;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  fbq.queue = [] as unknown[];
  window.fbq = fbq;
  if (!window._fbq) window._fbq = fbq;

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(script, first);

  window.fbq!("init", pixelId);
  window.fbq!("track", "PageView");
}

function initTikTokPixel(pixelId: string) {
  if (typeof window === "undefined" || window.ttq) return;

  const script = document.createElement("script");
  script.async = true;
  script.src =
    "https://analytics.tiktok.com/i18n/pixel/events.js?sdkid=" +
    pixelId +
    "&lib=ttq";
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(script, first);

  // Minimal ttq stub until real SDK loads
  const ttq: Record<string, any> = {
    _i: {},
    _t: {},
    on() {},
    off() {},
    once() {},
    ready() {},
    alias() {},
    group() {},
    enableCookie() {},
    disableCookie() {},
    load(id: string) {
      ttq._i[id] = [];
      ttq._t[id] = +new Date();
    },
    page() {},
    track() {},
    identify() {},
  };
  window.ttq = ttq;
  window.ttq.load(pixelId);
  window.ttq.page();
}

interface TrackEventParams {
  value?: number;
  currency?: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
  event_id?: string;
}

export function useTracking(tracking: TrackingConfig | null | undefined) {
  const initialized = useRef(false);

  useEffect(() => {
    if (!tracking || initialized.current) return;
    initialized.current = true;

    if (tracking.facebook_pixel_id) {
      initFacebookPixel(tracking.facebook_pixel_id);
    }
    if (tracking.tiktok_pixel_id) {
      initTikTokPixel(tracking.tiktok_pixel_id);
    }
  }, [tracking]);

  const trackEvent = useCallback(
    (eventName: string, params?: TrackEventParams) => {
      if (!tracking) return;

      // Facebook Pixel
      if (tracking.facebook_pixel_id && window.fbq) {
        const fbParams: Record<string, unknown> = {};
        if (params?.value !== undefined) fbParams.value = params.value;
        if (params?.currency) fbParams.currency = params.currency;
        if (params?.content_name) fbParams.content_name = params.content_name;
        if (params?.content_ids) fbParams.content_ids = params.content_ids;
        if (params?.content_type) fbParams.content_type = params.content_type;

        if (params?.event_id) {
          window.fbq("track", eventName, fbParams, {
            eventID: params.event_id,
          });
        } else {
          window.fbq("track", eventName, fbParams);
        }
      }

      // TikTok Pixel
      if (tracking.tiktok_pixel_id && window.ttq) {
        const ttParams: Record<string, unknown> = {};
        if (params?.value !== undefined) ttParams.value = params.value;
        if (params?.currency) ttParams.currency = params.currency;
        if (params?.content_name) ttParams.content_name = params.content_name;
        if (params?.content_ids) ttParams.content_id = params.content_ids?.[0];
        if (params?.content_type) ttParams.content_type = params.content_type;

        const ttEventMap: Record<string, string> = {
          ViewContent: "ViewContent",
          InitiateCheckout: "InitiateCheckout",
          Purchase: "CompletePayment",
        };

        const ttEvent = ttEventMap[eventName] || eventName;
        window.ttq.track(ttEvent, ttParams);
      }
    },
    [tracking]
  );

  return { trackEvent };
}
