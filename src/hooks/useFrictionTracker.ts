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

export function useFrictionTracker(storeId: number, productId?: number) {
  const pageStartRef = useRef(Date.now());
  const maxScrollRef = useRef(0);
  const scrollMilestonesRef = useRef(new Set<number>());
  const sentLeaveRef = useRef(false);

  const send = useCallback(
    (eventType: string, metadata?: Record<string, any>) => {
      sendTrackEvent({
        store_id: storeId,
        product_id: productId,
        event_type: eventType,
        session_id: getSessionId(),
        ...getUtmParams(),
        metadata,
      });
    },
    [storeId, productId]
  );

  useEffect(() => {
    pageStartRef.current = Date.now();

    // --- Performance tracking ---
    const sendPerf = () => {
      try {
        const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming;
        if (nav) {
          send("page_view", {
            load_time_ms: Math.round(nav.loadEventEnd - nav.startTime),
            dom_ready_ms: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
            ttfb_ms: Math.round(nav.responseStart - nav.startTime),
            transfer_size: nav.transferSize,
          });
        }
      } catch {}
    };

    if (document.readyState === "complete") {
      setTimeout(sendPerf, 100);
    } else {
      window.addEventListener("load", () => setTimeout(sendPerf, 100), { once: true });
    }

    // --- Scroll depth tracking (25%, 50%, 75%, 100%) ---
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const pct = Math.round((scrollTop / docHeight) * 100);
      if (pct > maxScrollRef.current) maxScrollRef.current = pct;

      const milestones = [25, 50, 75, 100];
      for (const m of milestones) {
        if (pct >= m && !scrollMilestonesRef.current.has(m)) {
          scrollMilestonesRef.current.add(m);
          send("scroll_depth", { depth: m });
        }
      }
    };

    let scrollTimer: ReturnType<typeof setTimeout>;
    const throttledScroll = () => {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(handleScroll, 200);
    };

    window.addEventListener("scroll", throttledScroll, { passive: true });

    // --- Page leave tracking (time on page + max scroll) ---
    const handleLeave = () => {
      if (sentLeaveRef.current) return;
      sentLeaveRef.current = true;

      const timeOnPage = Math.round((Date.now() - pageStartRef.current) / 1000);
      send("page_leave", {
        time_on_page_s: timeOnPage,
        max_scroll_pct: maxScrollRef.current,
      });
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") handleLeave();
    });
    window.addEventListener("pagehide", handleLeave);

    // --- JS Error tracking ---
    const handleError = (event: ErrorEvent) => {
      send("js_error", {
        message: event.message?.slice(0, 200),
        source: event.filename?.slice(-100),
        line: event.lineno,
      });
    };
    window.addEventListener("error", handleError);

    // --- CTA click tracking ---
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cta = target.closest("[data-track-cta]") as HTMLElement | null;
      if (cta) {
        send("cta_click", {
          cta_id: cta.dataset.trackCta,
          cta_text: cta.textContent?.trim().slice(0, 50),
        });
      }
    };
    document.addEventListener("click", handleClick);

    // --- Form field tracking ---
    const formFieldsInteracted = new Set<string>();
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") {
        const fieldName = target.name || target.id || target.type;
        if (!formFieldsInteracted.has(fieldName)) {
          formFieldsInteracted.add(fieldName);
          send("form_focus", {
            field: fieldName,
            fields_touched: formFieldsInteracted.size,
          });
        }
      }
    };
    document.addEventListener("focusin", handleFocus);

    return () => {
      window.removeEventListener("scroll", throttledScroll);
      window.removeEventListener("pagehide", handleLeave);
      window.removeEventListener("error", handleError);
      document.removeEventListener("click", handleClick);
      document.removeEventListener("focusin", handleFocus);
      clearTimeout(scrollTimer);
    };
  }, [send]);

  // Expose manual tracking for form abandonment
  const trackFormAbandon = useCallback(
    (lastField: string, fieldsCompleted: number, totalFields: number) => {
      send("form_abandon", {
        last_field: lastField,
        fields_completed: fieldsCompleted,
        total_fields: totalFields,
        time_on_page_s: Math.round((Date.now() - pageStartRef.current) / 1000),
      });
    },
    [send]
  );

  return { trackFormAbandon, send };
}
