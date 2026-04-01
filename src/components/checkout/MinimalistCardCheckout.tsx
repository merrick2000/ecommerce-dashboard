"use client";

import Image from "next/image";
import type { CheckoutPageData } from "@/lib/api";
import { CheckoutForm, type TrackEventFn } from "./CheckoutForm";
import { UrgencyWidgets } from "./UrgencyWidgets";
import { StickyMobileCTA } from "./StickyMobileCTA";
import { SalesPopup } from "./SalesPopup";
import { PaymentLogos } from "./PaymentLogos";
import { StoreFooter } from "./StoreFooter";
import PriceDisplay from "./PriceDisplay";
import { t, type Locale } from "@/lib/i18n";

export function MinimalistCardCheckout({ data, trackEvent, onTrackInternal }: { data: CheckoutPageData; trackEvent?: TrackEventFn; onTrackInternal?: (eventType: string) => void }) {
  const { store, product, checkout_config: config } = data;
  const locale: Locale = store.locale || 'fr';

  const scrollToForm = () => {
    document.getElementById("checkout-form")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4 pb-20 md:pb-4">
      <div className="w-full max-w-md">
        <UrgencyWidgets urgencyConfig={config.urgency_config} color={config.primary_color} locale={locale} />

        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {product.cover_image && (
            <div className="relative w-full h-48">
              <Image
                src={product.cover_image}
                alt={product.name}
                fill
                sizes="(max-width: 768px) 100vw, 448px"
                className="object-cover"
                priority
              />
            </div>
          )}

          <div className="p-6 space-y-5">
            <p className="text-xs font-medium text-gray-400 tracking-wider uppercase">
              {store.name}
            </p>

            <div>
              <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
              <div className="mt-1">
                <PriceDisplay product={product} size="lg" primaryColor={config.primary_color} currency={product.currency} />
              </div>
            </div>

            {product.description && (
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-3">
                {product.description}
              </p>
            )}

            {config.trust_badges.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {config.trust_badges.map((badge, i) => (
                  <span
                    key={i}
                    className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-medium"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}

            <hr className="border-gray-100" />

            <div id="checkout-form">
              <CheckoutForm data={data} compact onTrackEvent={trackEvent} onTrackInternal={onTrackInternal} />
            </div>

            <PaymentLogos locale={locale} />
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          {t('checkout.secure', locale)} — {store.currency}
        </p>
      </div>

      <StickyMobileCTA
        price={product.has_promo ? product.formatted_effective_price : product.formatted_price}
        originalPrice={product.formatted_price}
        hasPromo={product.has_promo}
        promoLabel={product.promo_label}
        ctaText={config.cta_text}
        color={config.primary_color}
        onCtaClick={scrollToForm}
      />

      <StoreFooter storeName={store.name} locale={locale} />

      <SalesPopup config={config.sales_popup} productName={product.name} locale={locale} />
    </div>
  );
}
