"use client";

import { useEffect, useRef } from "react";
import type { CheckoutPageData } from "@/lib/api";
import { useTracking } from "@/hooks/useTracking";
import { usePageTracking } from "@/hooks/usePageTracking";
import { useFrictionTracker } from "@/hooks/useFrictionTracker";
import { ClassicCheckout } from "./ClassicCheckout";
import { DarkPremiumCheckout } from "./DarkPremiumCheckout";
import { MinimalistCardCheckout } from "./MinimalistCardCheckout";
import { WhatsAppChat } from "./WhatsAppChat";

interface CheckoutSwitcherProps {
  data: CheckoutPageData;
  promoCode?: string;
}

export function CheckoutSwitcher({ data, promoCode }: CheckoutSwitcherProps) {
  const templateType = data.checkout_config.template_type;
  const tracking = data.checkout_config.tracking;
  const { trackEvent } = useTracking(tracking);
  const { trackEvent: trackInternal } = usePageTracking(data.store.id, data.product.id);
  useFrictionTracker(data.store.id, data.product.id);
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

    trackInternal("product_viewed", data.product.id, {
      product_name: data.product.name,
      price: data.product.effective_price,
      currency: data.store.currency,
    });

    if (promoCode) {
      trackInternal("promo_click", data.product.id, { promo_code: promoCode });
    }
  }, [trackEvent, trackInternal, data, promoCode]);

  const locale = data.store.locale || "fr";
  const wa = data.product.whatsapp_chat;

  let checkout;
  switch (templateType) {
    case "DARK_PREMIUM":
      checkout = <DarkPremiumCheckout data={data} trackEvent={trackEvent} onTrackInternal={trackInternal} promoCode={promoCode} />;
      break;
    case "MINIMALIST_CARD":
      checkout = <MinimalistCardCheckout data={data} trackEvent={trackEvent} onTrackInternal={trackInternal} promoCode={promoCode} />;
      break;
    case "CLASSIC":
    default:
      checkout = <ClassicCheckout data={data} trackEvent={trackEvent} onTrackInternal={trackInternal} promoCode={promoCode} />;
  }

  return (
    <>
      {checkout}
      {wa?.enabled && wa?.phone && (
        <WhatsAppChat
          phone={wa.phone}
          welcomeMessage={wa.welcome_message}
          productName={data.product.name}
          locale={locale}
          position={wa.position || "bottom-right"}
          paymentLink={data.product.payment_link}
          paymentMode={data.product.payment_mode}
          formattedPrice={data.product.formatted_effective_price}
          features={data.product.features}
        />
      )}
    </>
  );
}
