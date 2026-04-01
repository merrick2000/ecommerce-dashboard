"use client";

import type { Locale } from "@/lib/i18n";

interface PromoBannerProps {
  promoCode: string;
  locale?: Locale;
  dark?: boolean;
}

const txt = {
  fr: "Code promo appliqué :",
  en: "Promo code applied:",
};

export function PromoBanner({ promoCode, locale = "fr", dark }: PromoBannerProps) {
  return (
    <div
      className={`flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium ${
        dark
          ? "bg-emerald-900/30 text-emerald-300 border-b border-emerald-800/50"
          : "bg-emerald-50 text-emerald-700 border-b border-emerald-100"
      }`}
    >
      <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{txt[locale]}</span>
      <span className="font-bold tracking-wider">{promoCode}</span>
    </div>
  );
}
