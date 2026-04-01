"use client";

import type { Locale } from "@/lib/i18n";

interface PaymentLogosProps {
  dark?: boolean;
  locale?: Locale;
}

const txt = {
  fr: "Moyens de paiement acceptés",
  en: "Accepted payment methods",
};

export function PaymentLogos({ dark, locale = "fr" }: PaymentLogosProps) {
  return (
    <div className="space-y-2">
      <p className={`text-xs font-medium text-center ${dark ? "text-gray-500" : "text-gray-400"}`}>
        {txt[locale]}
      </p>
      <div className="flex items-center justify-center gap-1 flex-wrap">
        <img
          src="/images/payment-methods/payment-cfa.png"
          alt="Paiements CFA"
          className={`h-6 object-contain ${dark ? "brightness-90" : ""}`}
        />
        <img
          src="/images/payment-methods/payment-ghs.png"
          alt="Paiements GHS"
          className={`h-6 object-contain ${dark ? "brightness-90" : ""}`}
        />
        <img
          src="/images/payment-methods/payment-kes.png"
          alt="Paiements KES"
          className={`h-6 object-contain ${dark ? "brightness-90" : ""}`}
        />
      </div>
    </div>
  );
}
