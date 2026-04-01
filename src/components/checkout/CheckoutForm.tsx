"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { captureEvent } from "@/lib/posthog";
import { createOrder, initiatePayment, captureLeadEmail, type CheckoutPageData } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

export type TrackEventFn = (eventName: string, params?: Record<string, unknown>) => void;

interface CheckoutFormProps {
  data: CheckoutPageData;
  dark?: boolean;
  compact?: boolean;
  onTrackEvent?: TrackEventFn;
  onTrackInternal?: (eventType: string) => void;
  promoCode?: string;
}

const COUNTRIES = [
  // Afrique de l'Ouest
  { code: 'BJ', dial: '+229', flag: '🇧🇯', name: 'Bénin' },
  { code: 'BF', dial: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'CI', dial: '+225', flag: '🇨🇮', name: "Côte d'Ivoire" },
  { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'GN', dial: '+224', flag: '🇬🇳', name: 'Guinée' },
  { code: 'ML', dial: '+223', flag: '🇲🇱', name: 'Mali' },
  { code: 'NE', dial: '+227', flag: '🇳🇪', name: 'Niger' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'SN', dial: '+221', flag: '🇸🇳', name: 'Sénégal' },
  { code: 'SL', dial: '+232', flag: '🇸🇱', name: 'Sierra Leone' },
  { code: 'TG', dial: '+228', flag: '🇹🇬', name: 'Togo' },
  // Afrique Centrale
  { code: 'CM', dial: '+237', flag: '🇨🇲', name: 'Cameroun' },
  { code: 'CG', dial: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: 'CD', dial: '+243', flag: '🇨🇩', name: 'RD Congo' },
  { code: 'GA', dial: '+241', flag: '🇬🇦', name: 'Gabon' },
  // Afrique de l'Est
  { code: 'ET', dial: '+251', flag: '🇪🇹', name: 'Éthiopie' },
  { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenya' },
  { code: 'RW', dial: '+250', flag: '🇷🇼', name: 'Rwanda' },
  { code: 'TZ', dial: '+255', flag: '🇹🇿', name: 'Tanzanie' },
  { code: 'UG', dial: '+256', flag: '🇺🇬', name: 'Ouganda' },
  // Afrique Australe
  { code: 'LS', dial: '+266', flag: '🇱🇸', name: 'Lesotho' },
  { code: 'MW', dial: '+265', flag: '🇲🇼', name: 'Malawi' },
  { code: 'MZ', dial: '+258', flag: '🇲🇿', name: 'Mozambique' },
  { code: 'ZM', dial: '+260', flag: '🇿🇲', name: 'Zambie' },
  // Autres
  { code: 'FR', dial: '+33', flag: '🇫🇷', name: 'France' },
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

function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const cached = sessionStorage.getItem("_slt_utm");
  if (cached) return JSON.parse(cached);
  return {};
}

export function CheckoutForm({ data, dark, compact, onTrackEvent, onTrackInternal, promoCode }: CheckoutFormProps) {
  const { store, product, checkout_config: config } = data;
  const locale: Locale = store.locale || 'fr';
  const router = useRouter();
  // Pré-remplir depuis localStorage si le visiteur revient
  const [email, setEmail] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("_slt_email") || "";
  });
  const [name, setName] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("_slt_name") || "";
  });
  const [phone, setPhone] = useState(() => {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("_slt_phone") || "";
  });
  const [dialCode, setDialCode] = useState(() => {
    if (typeof window === "undefined") return COUNTRIES[0].dial;
    return localStorage.getItem("_slt_dial") || COUNTRIES[0].dial;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const initiateCheckoutFired = useRef(false);

  const fireInitiateCheckout = () => {
    if (initiateCheckoutFired.current) return;
    initiateCheckoutFired.current = true;
    onTrackInternal?.("checkout_initiate");
    if (!onTrackEvent) return;
    onTrackEvent("InitiateCheckout", {
      value: product.effective_price,
      currency: store.currency,
      content_name: product.name,
      content_ids: [String(product.id)],
      content_type: "product",
    });
  };

  const isExternalLink = product.payment_mode === 'external_link' && product.payment_link;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (isExternalLink) {
      // Mode lien externe : on crée la commande pour le tracking puis on redirige
      const utm = getUtmParams();
      try {
        await createOrder({
          store_id: store.id,
          product_id: product.id,
          customer_email: email,
          customer_name: name || undefined,
          customer_phone: phone ? `${dialCode}${phone}` : undefined,
          ...utm,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
          promo_code: promoCode || undefined,
        });
      } catch {
        // On redirige quand même, la commande est optionnelle en mode externe
      }
      window.open(product.payment_link!, '_blank');
      setLoading(false);
      return;
    }

    try {
      const utm = getUtmParams();
      const result = await createOrder({
        store_id: store.id,
        product_id: product.id,
        customer_email: email,
        customer_name: name || undefined,
        customer_phone: phone ? `${dialCode}${phone}` : undefined,
        ...utm,
        referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        promo_code: promoCode || undefined,
      });

      // Sauvegarder pour pré-remplir au prochain achat
      localStorage.setItem("_slt_email", email);
      localStorage.setItem("_slt_name", name);
      if (phone) localStorage.setItem("_slt_phone", phone);
      if (dialCode) localStorage.setItem("_slt_dial", dialCode);

      onTrackInternal?.("checkout_form_submitted");

      // Si seuls les providers redirect sont activés, initier le paiement directement
      if (product.redirect_only_payment) {
        try {
          const payResult = await initiatePayment({
            order_id: result.order.id,
            country: "XX",
            network: "redirect",
            phone: phone ? `${dialCode}${phone}` : "0000000000",
          });

          if (payResult.status === "redirect" && payResult.redirect_url) {
            window.location.href = payResult.redirect_url;
            return;
          }
        } catch {
          // Fallback: aller sur la page de paiement classique
        }
      }

      // Sinon, rediriger vers la page de sélection pays/réseau
      router.push(`/${store.slug}/p/${product.id}/pay?order=${result.order.id}`);
    } catch (err) {
      captureEvent("exception", { error: String(err) });
      onTrackInternal?.("checkout_error");
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
          {formTxt.name[locale]}
        </label>
        <input
          type="text"
          id="name"
          required
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
          onBlur={() => {
            if (email && email.includes("@")) {
              captureLeadEmail({
                store_id: store.id,
                product_id: product.id,
                email,
                name: name || undefined,
                phone: phone ? `${dialCode}${phone}` : undefined,
              });
            }
          }}
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
            required
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
        data-track-cta="checkout_submit"
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
