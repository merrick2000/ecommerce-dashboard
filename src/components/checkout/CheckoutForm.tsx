"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createOrder, type CheckoutPageData } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

export type TrackEventFn = (eventName: string, params?: Record<string, unknown>) => void;

interface CheckoutFormProps {
  data: CheckoutPageData;
  dark?: boolean;
  compact?: boolean;
  onTrackEvent?: TrackEventFn;
}

const COUNTRIES = [
  { code: 'BJ', dial: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: 'BF', dial: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'CI', dial: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'CM', dial: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: 'CG', dial: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
  { code: 'GN', dial: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: 'ML', dial: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: 'NE', dial: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: 'SN', dial: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: 'TG', dial: '+228', flag: '🇹🇬', name: 'Togo' },
];

const formTxt = {
  name: { fr: 'Nom', en: 'Name' },
  optional: { fr: '(optionnel)', en: '(optional)' },
  name_placeholder: { fr: 'Votre nom', en: 'Your name' },
  email: { fr: 'Email', en: 'Email' },
  whatsapp: { fr: 'WhatsApp', en: 'WhatsApp' },
  phone_placeholder: { fr: 'Numéro WhatsApp', en: 'WhatsApp number' },
  processing: { fr: 'Traitement...', en: 'Processing...' },
  error: { fr: 'Une erreur est survenue', en: 'An error occurred' },
};

export function CheckoutForm({ data, dark, compact, onTrackEvent }: CheckoutFormProps) {
  const { store, product, checkout_config: config } = data;
  const locale: Locale = store.locale || 'fr';
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [dialCode, setDialCode] = useState(COUNTRIES[0].dial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const initiateCheckoutFired = useRef(false);

  const fireInitiateCheckout = () => {
    if (initiateCheckoutFired.current || !onTrackEvent) return;
    initiateCheckoutFired.current = true;
    onTrackEvent("InitiateCheckout", {
      value: product.effective_price,
      currency: store.currency,
      content_name: product.name,
      content_ids: [String(product.id)],
      content_type: "product",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await createOrder({
        store_id: store.id,
        product_id: product.id,
        customer_email: email,
        customer_name: name || undefined,
        customer_phone: phone ? `${dialCode}${phone}` : undefined,
      });

      // Rediriger vers la page de paiement
      router.push(`/${store.slug}/p/${product.id}/pay?order=${result.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : formTxt.error[locale]);
      setLoading(false);
    }
  };

  const inputClass = dark
    ? "w-full rounded-lg bg-gray-700/50 border border-gray-600 px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:border-transparent"
    : compact
    ? "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
    : "w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent";

  const labelClass = dark
    ? "block text-sm font-medium text-gray-300 mb-1.5"
    : "block text-sm font-medium text-gray-700 mb-1.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          {formTxt.name[locale]} {compact ? "" : formTxt.optional[locale]}
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={fireInitiateCheckout}
          placeholder={formTxt.name_placeholder[locale]}
          className={inputClass}
          style={{ "--tw-ring-color": config.primary_color } as React.CSSProperties}
        />
      </div>

      <div>
        <label htmlFor="email" className={labelClass}>
          Email
        </label>
        <input
          type="email"
          id="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onFocus={fireInitiateCheckout}
          placeholder="vous@email.com"
          className={inputClass}
          style={{ "--tw-ring-color": config.primary_color } as React.CSSProperties}
        />
      </div>

      <div>
        <label htmlFor="phone" className={labelClass}>
          {formTxt.whatsapp[locale]}
        </label>
        <div className="flex gap-2">
          <select
            value={dialCode}
            onChange={(e) => setDialCode(e.target.value)}
            className={`${dark
              ? "rounded-lg bg-gray-700/50 border border-gray-600 px-2 py-3 text-white focus:outline-none focus:ring-2 focus:border-transparent"
              : compact
              ? "rounded-lg border border-gray-200 px-2 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
              : "rounded-lg border border-gray-300 px-2 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:border-transparent"
            } shrink-0 w-[100px]`}
            style={{ "--tw-ring-color": config.primary_color } as React.CSSProperties}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.dial}>
                {c.flag} {c.dial}
              </option>
            ))}
          </select>
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
            onFocus={fireInitiateCheckout}
            placeholder={formTxt.phone_placeholder[locale]}
            inputMode="numeric"
            className={`${inputClass} flex-1`}
            style={{ "--tw-ring-color": config.primary_color } as React.CSSProperties}
          />
        </div>
      </div>

      {error && (
        <p className="text-red-500 text-sm font-medium">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl py-3.5 text-white font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ backgroundColor: config.primary_color }}
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            {formTxt.processing[locale]}
          </span>
        ) : (
          config.cta_text
        )}
      </button>
    </form>
  );
}
