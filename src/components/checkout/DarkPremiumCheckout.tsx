"use client";

import { useState } from "react";
import type { CheckoutPageData } from "@/lib/api";
import { CheckoutForm, type TrackEventFn } from "./CheckoutForm";
import { UrgencyWidgets } from "./UrgencyWidgets";
import { StickyMobileCTA } from "./StickyMobileCTA";
import { SalesPopup } from "./SalesPopup";
import { PaymentLogos } from "./PaymentLogos";
import { StoreFooter } from "./StoreFooter";
import { Testimonials } from "./Testimonials";
import { VideoSection } from "./VideoSection";
import PriceDisplay from "./PriceDisplay";
import { DescriptionWithCTAs } from "./DescriptionWithCTAs";
import { t, type Locale } from "@/lib/i18n";

function FeaturesBlock({ features, color }: { features: string[]; color: string }) {
  if (!features || features.length === 0) return null;

  return (
    <div className="rounded-xl p-5 bg-white/5 border border-white/10">
      <h3
        className="text-sm font-bold uppercase tracking-widest mb-4"
        style={{ color }}
      >
        Ce que vous obtenez
      </h3>
      <ul className="space-y-3">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-3">
            <svg
              className="w-5 h-5 shrink-0 mt-0.5"
              style={{ color }}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-gray-300 text-sm leading-relaxed">{f}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FAQSection({ faqs, color }: { faqs: { question: string; answer: string }[]; color: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  if (!faqs || faqs.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold text-white mb-4">Questions fréquentes</h2>
      <div className="space-y-2">
        {faqs.map((faq, i) => (
          <div key={i} className="border border-white/10 rounded-xl overflow-hidden bg-white/5">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-white/5 transition-colors"
            >
              <span className="font-semibold text-gray-200 text-sm">{faq.question}</span>
              <svg
                className={`w-5 h-5 text-gray-500 shrink-0 transition-transform ${openIndex === i ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {openIndex === i && (
              <div className="px-5 pb-4">
                <p className="text-sm text-gray-400 leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function DarkPremiumCheckout({ data, trackEvent }: { data: CheckoutPageData; trackEvent?: TrackEventFn }) {
  const { store, product, checkout_config: config } = data;
  const locale: Locale = store.locale || 'fr';

  const scrollToForm = () => {
    document.getElementById("checkout-form")?.scrollIntoView({ behavior: "smooth" });
  };

  const featuresBlock = (
    <FeaturesBlock features={product.features} color={config.primary_color} />
  );

  const videoBlock = product.video_url ? (
    <VideoSection url={product.video_url} title={product.video_title} dark />
  ) : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-20 md:pb-0 relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] rounded-full opacity-15 blur-[120px] pointer-events-none"
        style={{ backgroundColor: config.primary_color }}
      />

      {/* Sticky header */}
      <header className="sticky top-0 z-40 bg-gray-950/70 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <h2
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: config.primary_color }}
          >
            {store.name}
          </h2>
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <svg className="w-3.5 h-3.5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
            {t('checkout.secure', locale)}
          </div>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 py-10">
        <UrgencyWidgets urgencyConfig={config.urgency_config} color={config.primary_color} dark locale={locale} />

        <div className="grid gap-10 lg:grid-cols-5">
          {/* Left column — product showcase */}
          <div className="lg:col-span-3 space-y-8">
            {product.cover_image && (
              <div className="relative group">
                <div
                  className="absolute -inset-1 rounded-2xl opacity-40 blur-xl transition-opacity duration-500 group-hover:opacity-60"
                  style={{ backgroundColor: config.primary_color }}
                />
                <img
                  src={product.cover_image}
                  alt={product.name}
                  className="relative w-full rounded-2xl object-cover aspect-video shadow-2xl shadow-black/50 transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>
            )}

            <div>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                {product.name}
              </h1>
              {/* Mobile price */}
              <div className="mt-3 lg:hidden">
                <PriceDisplay product={product} size="lg" primaryColor={config.primary_color} />
              </div>
            </div>

            {/* Video: below_image */}
            {product.video_position === "below_image" && videoBlock}

            {/* Features: above_description */}
            {product.features_position === "above_description" && featuresBlock}

            {/* Video: above_description */}
            {product.video_position === "above_description" && videoBlock}

            {product.description && (
              <DescriptionWithCTAs
                description={product.description}
                ctas={product.description_ctas}
                primaryColor={config.primary_color}
                dark
                className="prose prose-invert prose-lg max-w-none prose-p:text-gray-400 prose-headings:text-white prose-strong:text-gray-200 prose-a:text-blue-400"
              />
            )}

            {/* Video: below_description (default) */}
            {(product.video_position === "below_description" || !product.video_position) && videoBlock}

            {/* Features: below_description (default) */}
            {(product.features_position === "below_description" || !product.features_position) && featuresBlock}

            {config.trust_badges.length > 0 && (
              <div className="flex flex-wrap gap-2.5">
                {config.trust_badges.map((badge, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: config.primary_color + "15",
                      color: config.primary_color,
                      border: `1px solid ${config.primary_color}30`,
                    }}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {badge}
                  </span>
                ))}
              </div>
            )}

            {/* Guarantee */}
            <div className="flex items-start gap-3 rounded-xl p-4 bg-white/5 border border-white/10">
              <svg
                className="w-6 h-6 shrink-0 mt-0.5"
                style={{ color: config.primary_color }}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <div>
                <p className="text-sm font-bold text-white">{t('checkout.instant_guaranteed', locale)}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Recevez votre produit immédiatement après le paiement. Satisfaction garantie.
                </p>
              </div>
            </div>

            {/* Testimonials */}
            <Testimonials
              testimonials={product.testimonials}
              style={product.testimonials_style}
              color={config.primary_color}
              dark
            />

            {/* FAQ at bottom */}
            <FAQSection faqs={product.faqs} color={config.primary_color} />
          </div>

          {/* Right column — checkout form */}
          <div className="lg:col-span-2">
            <div
              id="checkout-form"
              className="bg-gray-900/80 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-2xl h-fit lg:sticky lg:top-20"
            >
              <div
                className="px-6 py-5 text-center"
                style={{
                  background: `linear-gradient(135deg, ${config.primary_color}15, transparent)`,
                }}
              >
                <p className="text-xs text-gray-500 font-medium uppercase tracking-widest">
                  {t('checkout.total', locale)}
                </p>
                <div className="mt-1 flex justify-center">
                  <PriceDisplay product={product} size="lg" primaryColor={config.primary_color} />
                </div>
                <p className="text-xs text-gray-500 mt-1">{store.currency}</p>
              </div>

              {/* Features: above_form */}
              {product.features_position === "above_form" && product.features?.length > 0 && (
                <div className="px-6 pt-4">
                  <ul className="space-y-2">
                    {product.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <svg
                          className="w-4 h-4 shrink-0 mt-0.5"
                          style={{ color: config.primary_color }}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <hr className="border-white/10 mt-4" />
                </div>
              )}

              <div className="p-6">
                <CheckoutForm data={data} dark onTrackEvent={trackEvent} />
              </div>

              <div className="px-6">
                <PaymentLogos dark />
              </div>

              {/* Micro-trust indicators */}
              <div className="px-6 pb-5 flex items-center justify-center gap-4 text-xs text-gray-600">
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  SSL
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Garanti
                </span>
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM4 11a1 1 0 100-2H3a1 1 0 000 2h1zM10 18a8 8 0 100-16 8 8 0 000 16zm0-2a6 6 0 100-12 6 6 0 000 12z" />
                  </svg>
                  {t('checkout.instant', locale)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <StickyMobileCTA
        price={product.has_promo ? product.formatted_effective_price : product.formatted_price}
        originalPrice={product.formatted_price}
        hasPromo={product.has_promo}
        promoLabel={product.promo_label}
        ctaText={config.cta_text}
        color={config.primary_color}
        onCtaClick={scrollToForm}
      />

      <StoreFooter storeName={store.name} dark locale={locale} />

      <SalesPopup config={config.sales_popup} productName={product.name} dark locale={locale} />
    </div>
  );
}
