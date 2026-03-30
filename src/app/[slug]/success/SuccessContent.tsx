"use client";

import { useState, useEffect, useRef } from "react";
import posthog from "posthog-js";
import type { OrderDetailsResponse } from "@/lib/api";
import { trackDownload } from "@/lib/api";
import { useTracking } from "@/hooks/useTracking";
import Link from "next/link";
import { StoreFooter } from "@/components/checkout/StoreFooter";
import { t, type Locale } from "@/lib/i18n";

export function SuccessContent({ data, eventId }: { data: OrderDetailsResponse; eventId?: string }) {
  const { order, product, store, download_url, is_external, tracking } = data;
  const locale: Locale = store.locale || 'fr';
  const isPaid = order.status === "paid";
  const [downloading, setDownloading] = useState(false);
  const { trackEvent } = useTracking(tracking);
  const purchaseFired = useRef(false);

  useEffect(() => {
    if (purchaseFired.current || !isPaid) return;
    purchaseFired.current = true;

    trackEvent("Purchase", {
      value: order.amount,
      currency: order.currency,
      content_name: product.name,
      content_ids: [String(product.id)],
      content_type: "product",
      event_id: eventId,
    });

    posthog.capture("purchase_completed", {
      order_id: order.id,
      product_id: product.id,
      product_name: product.name,
      store_id: store.id,
      amount: order.amount,
      currency: order.currency,
    });
  }, [trackEvent, isPaid, order, product, store, eventId]);

  const handleDownload = () => {
    if (!download_url) return;
    setDownloading(true);
    trackDownload(order.id);
    posthog.capture("product_downloaded", {
      order_id: order.id,
      product_id: product.id,
      store_id: store.id,
    });
    window.open(download_url, "_blank");
    setTimeout(() => setDownloading(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header vert */}
          <div className="bg-green-500 px-6 py-8 text-center text-white">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold">{t('success.payment_confirmed', locale)}</h1>
            <p className="text-green-100 mt-1">
              {t('success.thanks', locale)}, {order.customer_name || order.customer_email}
            </p>
          </div>

          {/* Contenu */}
          <div className="p-6 space-y-6">
            {/* Résumé commande */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-4">
                {product.cover_image && (
                  <img
                    src={product.cover_image}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-500">{store.name}</p>
                </div>
              </div>

              <hr className="border-gray-200" />

              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('success.amount_paid', locale)}</span>
                <span className="font-bold text-gray-900">
                  {order.formatted_amount}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('success.order', locale)}</span>
                <span className="font-mono text-gray-600">#{order.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Email</span>
                <span className="text-gray-600">{order.customer_email}</span>
              </div>
            </div>

            {/* Bouton téléchargement */}
            {isPaid && download_url ? (
              <div className="space-y-3">
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full flex items-center justify-center gap-3 bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-6 rounded-xl transition-all disabled:opacity-70"
                >
                  {downloading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                          fill="none"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      {t('success.downloading', locale)}
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      {is_external ? t('success.access', locale) : t('success.download', locale)}
                    </>
                  )}
                </button>
                <p className="text-xs text-center text-gray-400">
                  {t('success.link_expires', locale)}
                </p>
              </div>
            ) : isPaid ? (
              <div className="text-center py-4 bg-yellow-50 rounded-xl">
                <p className="text-yellow-700 font-medium">
                  {t('success.no_file', locale)}
                </p>
              </div>
            ) : (
              <div className="text-center py-4 bg-yellow-50 rounded-xl">
                <p className="text-yellow-700 font-medium">
                  {t('success.verifying', locale)}
                </p>
                <p className="text-yellow-600 text-sm mt-1">
                  {t('success.verifying_detail', locale)}
                </p>
              </div>
            )}

            {/* Confirmation email */}
            <div className="flex items-start gap-3 bg-blue-50 rounded-xl p-4">
              <svg
                className="w-5 h-5 text-blue-500 mt-0.5 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900">
                  {t('success.confirmation_sent', locale)}
                </p>
                <p className="text-xs text-blue-700 mt-0.5">
                  {t('success.recap_sent', locale)} {order.customer_email}
                </p>
              </div>
            </div>

            {/* Retour */}
            <div className="text-center pt-2">
              <Link
                href={`/${store.slug}`}
                className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                &larr; {t('success.back_to_store', locale)}
              </Link>
            </div>
          </div>
        </div>
      </div>
      </div>

      <StoreFooter storeName={store.name} locale={locale} />
    </div>
  );
}
