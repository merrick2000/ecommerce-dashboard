"use client";

import { useEffect, useRef } from "react";
import type { CheckoutPageData } from "@/lib/api";
import { useTracking } from "@/hooks/useTracking";
import { usePageTracking } from "@/hooks/usePageTracking";
import { ClassicCheckout } from "./ClassicCheckout";
import { DarkPremiumCheckout } from "./DarkPremiumCheckout";
import { MinimalistCardCheckout } from "./MinimalistCardCheckout";

interface CheckoutSwitcherProps {
  data: CheckoutPageData;
}

export function CheckoutSwitcher({ data }: CheckoutSwitcherProps) {
  const templateType = data.checkout_config.template_type;
  const tracking = data.checkout_config.tracking;
  const { trackEvent } = useTracking(tracking);
  const { trackEvent: trackInternal } = usePageTracking(data.store.id, data.product.id);
  const viewContentFired = useRef(false);

  useEffect(() => {
    if (viewContentFired.current) return;
    viewContentFired.current = true;

    trackEvent("ViewContent", {
      value: data.product.effective_price,
      currency: data.store.currency,
      content_name: data.product.name,
      content_ids: [String(data.product.id)],
      content_type: "product",
    });
  }, [trackEvent, data]);

  switch (templateType) {
    case "DARK_PREMIUM":
      return <DarkPremiumCheckout data={data} trackEvent={trackEvent} onTrackInternal={trackInternal} />;
    case "MINIMALIST_CARD":
      return <MinimalistCardCheckout data={data} trackEvent={trackEvent} onTrackInternal={trackInternal} />;
    case "CLASSIC":
    default:
      return <ClassicCheckout data={data} trackEvent={trackEvent} onTrackInternal={trackInternal} />;
  }
}
