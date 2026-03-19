"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOrder, type CheckoutPageData } from "@/lib/api";

export type TrackEventFn = (eventName: string, params?: Record<string, unknown>) => void;

interface CheckoutFormProps {
  data: CheckoutPageData;
  dark?: boolean;
  compact?: boolean;
  onTrackEvent?: TrackEventFn;
}

const COUNTRIES = [
  // ─── Afrique de l'Ouest (UEMOA/CEDEAO) ───
  { code: "BJ", name: "Bénin", dial: "+229", flag: "🇧🇯" },
  { code: "BF", name: "Burkina Faso", dial: "+226", flag: "🇧🇫" },
  { code: "CV", name: "Cap-Vert", dial: "+238", flag: "🇨🇻" },
  { code: "CI", name: "Côte d'Ivoire", dial: "+225", flag: "🇨🇮" },
  { code: "GM", name: "Gambie", dial: "+220", flag: "🇬🇲" },
  { code: "GH", name: "Ghana", dial: "+233", flag: "🇬🇭" },
  { code: "GN", name: "Guinée", dial: "+224", flag: "🇬🇳" },
  { code: "GW", name: "Guinée-Bissau", dial: "+245", flag: "🇬🇼" },
  { code: "LR", name: "Liberia", dial: "+231", flag: "🇱🇷" },
  { code: "ML", name: "Mali", dial: "+223", flag: "🇲🇱" },
  { code: "MR", name: "Mauritanie", dial: "+222", flag: "🇲🇷" },
  { code: "NE", name: "Niger", dial: "+227", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", dial: "+234", flag: "🇳🇬" },
  { code: "SN", name: "Sénégal", dial: "+221", flag: "🇸🇳" },
  { code: "SL", name: "Sierra Leone", dial: "+232", flag: "🇸🇱" },
  { code: "TG", name: "Togo", dial: "+228", flag: "🇹🇬" },
  // ─── Afrique Centrale (CEMAC) ───
  { code: "CM", name: "Cameroun", dial: "+237", flag: "🇨🇲" },
  { code: "CF", name: "Centrafrique", dial: "+236", flag: "🇨🇫" },
  { code: "CG", name: "Congo", dial: "+242", flag: "🇨🇬" },
  { code: "CD", name: "RD Congo", dial: "+243", flag: "🇨🇩" },
  { code: "GA", name: "Gabon", dial: "+241", flag: "🇬🇦" },
  { code: "GQ", name: "Guinée équatoriale", dial: "+240", flag: "🇬🇶" },
  { code: "TD", name: "Tchad", dial: "+235", flag: "🇹🇩" },
  // ─── Afrique de l'Est ───
  { code: "BI", name: "Burundi", dial: "+257", flag: "🇧🇮" },
  { code: "DJ", name: "Djibouti", dial: "+253", flag: "🇩🇯" },
  { code: "ER", name: "Érythrée", dial: "+291", flag: "🇪🇷" },
  { code: "ET", name: "Éthiopie", dial: "+251", flag: "🇪🇹" },
  { code: "KE", name: "Kenya", dial: "+254", flag: "🇰🇪" },
  { code: "MG", name: "Madagascar", dial: "+261", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", dial: "+265", flag: "🇲🇼" },
  { code: "MU", name: "Maurice", dial: "+230", flag: "🇲🇺" },
  { code: "MZ", name: "Mozambique", dial: "+258", flag: "🇲🇿" },
  { code: "RW", name: "Rwanda", dial: "+250", flag: "🇷🇼" },
  { code: "SO", name: "Somalie", dial: "+252", flag: "🇸🇴" },
  { code: "SS", name: "Soudan du Sud", dial: "+211", flag: "🇸🇸" },
  { code: "TZ", name: "Tanzanie", dial: "+255", flag: "🇹🇿" },
  { code: "UG", name: "Ouganda", dial: "+256", flag: "🇺🇬" },
  // ─── Afrique du Nord ───
  { code: "DZ", name: "Algérie", dial: "+213", flag: "🇩🇿" },
  { code: "EG", name: "Égypte", dial: "+20", flag: "🇪🇬" },
  { code: "LY", name: "Libye", dial: "+218", flag: "🇱🇾" },
  { code: "MA", name: "Maroc", dial: "+212", flag: "🇲🇦" },
  { code: "SD", name: "Soudan", dial: "+249", flag: "🇸🇩" },
  { code: "TN", name: "Tunisie", dial: "+216", flag: "🇹🇳" },
  // ─── Afrique Australe ───
  { code: "AO", name: "Angola", dial: "+244", flag: "🇦🇴" },
  { code: "BW", name: "Botswana", dial: "+267", flag: "🇧🇼" },
  { code: "KM", name: "Comores", dial: "+269", flag: "🇰🇲" },
  { code: "LS", name: "Lesotho", dial: "+266", flag: "🇱🇸" },
  { code: "NA", name: "Namibie", dial: "+264", flag: "🇳🇦" },
  { code: "SC", name: "Seychelles", dial: "+248", flag: "🇸🇨" },
  { code: "ZA", name: "Afrique du Sud", dial: "+27", flag: "🇿🇦" },
  { code: "SZ", name: "Eswatini", dial: "+268", flag: "🇸🇿" },
  { code: "ZM", name: "Zambie", dial: "+260", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", dial: "+263", flag: "🇿🇼" },
  // ─── Europe ───
  { code: "DE", name: "Allemagne", dial: "+49", flag: "🇩🇪" },
  { code: "BE", name: "Belgique", dial: "+32", flag: "🇧🇪" },
  { code: "ES", name: "Espagne", dial: "+34", flag: "🇪🇸" },
  { code: "FR", name: "France", dial: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Italie", dial: "+39", flag: "🇮🇹" },
  { code: "LU", name: "Luxembourg", dial: "+352", flag: "🇱🇺" },
  { code: "NL", name: "Pays-Bas", dial: "+31", flag: "🇳🇱" },
  { code: "PT", name: "Portugal", dial: "+351", flag: "🇵🇹" },
  { code: "GB", name: "Royaume-Uni", dial: "+44", flag: "🇬🇧" },
  { code: "CH", name: "Suisse", dial: "+41", flag: "🇨🇭" },
  // ─── Amériques ───
  { code: "CA", name: "Canada", dial: "+1", flag: "🇨🇦" },
  { code: "US", name: "États-Unis", dial: "+1", flag: "🇺🇸" },
  { code: "HT", name: "Haïti", dial: "+509", flag: "🇭🇹" },
  { code: "BR", name: "Brésil", dial: "+55", flag: "🇧🇷" },
  // ─── Moyen-Orient ───
  { code: "AE", name: "Émirats arabes unis", dial: "+971", flag: "🇦🇪" },
  { code: "SA", name: "Arabie Saoudite", dial: "+966", flag: "🇸🇦" },
  { code: "LB", name: "Liban", dial: "+961", flag: "🇱🇧" },
  // ─── Asie ───
  { code: "CN", name: "Chine", dial: "+86", flag: "🇨🇳" },
  { code: "IN", name: "Inde", dial: "+91", flag: "🇮🇳" },
  { code: "TR", name: "Turquie", dial: "+90", flag: "🇹🇷" },
];

export function CheckoutForm({ data, dark, compact, onTrackEvent }: CheckoutFormProps) {
  const { store, product, checkout_config: config } = data;
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const initiateCheckoutFired = useRef(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fireInitiateCheckout = () => {
    if (initiateCheckoutFired.current || !onTrackEvent) return;
    initiateCheckoutFired.current = true;
    onTrackEvent("InitiateCheckout", {
      value: product.price,
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

    const fullPhone = phone ? `${selectedCountry.dial} ${phone}` : undefined;

    try {
      const result = await createOrder({
        store_id: store.id,
        product_id: product.id,
        customer_email: email,
        customer_name: name || undefined,
        customer_phone: fullPhone,
      });

      if (result.payment_url) {
        window.location.href = result.payment_url;
        return;
      }

      // Build success URL with event_id for Purchase dedup
      const successUrl = result.event_id
        ? `/${store.slug}/success?order=${result.order.id}&event_id=${result.event_id}`
        : `/${store.slug}/success?order=${result.order.id}`;

      router.push(successUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue");
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

  const filteredCountries = countrySearch
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
          c.dial.includes(countrySearch) ||
          c.code.toLowerCase().includes(countrySearch.toLowerCase())
      )
    : COUNTRIES;

  const dropdownClass = dark
    ? "absolute z-50 mt-1 w-64 rounded-lg bg-gray-800 border border-gray-600 shadow-2xl"
    : "absolute z-50 mt-1 w-64 rounded-lg bg-white border border-gray-200 shadow-2xl";

  const dropdownItemClass = dark
    ? "flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-200 hover:bg-gray-700 cursor-pointer"
    : "flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className={labelClass}>
          Nom {compact ? "" : "(optionnel)"}
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={fireInitiateCheckout}
          placeholder="Votre nom"
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

      {/* Phone with country selector */}
      <div>
        <label htmlFor="phone" className={labelClass}>
          WhatsApp / Téléphone
        </label>
        <div className="flex gap-2">
          {/* Country selector */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center gap-1.5 rounded-lg px-3 h-full min-w-[100px] shrink-0 ${
                dark
                  ? "bg-gray-700/50 border border-gray-600 text-white"
                  : compact
                  ? "border border-gray-200 text-gray-900 text-sm"
                  : "border border-gray-300 text-gray-900"
              }`}
            >
              <span className="text-lg leading-none">{selectedCountry.flag}</span>
              <span className={`font-medium ${compact ? "text-xs" : "text-sm"}`}>
                {selectedCountry.dial}
              </span>
              <svg
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${showDropdown ? "rotate-180" : ""} ${
                  dark ? "text-gray-400" : "text-gray-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showDropdown && (
              <div className={dropdownClass}>
                {/* Search */}
                <div className={`sticky top-0 p-2 ${dark ? "bg-gray-800" : "bg-white"}`}>
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    placeholder="Rechercher un pays..."
                    autoFocus
                    className={`w-full rounded-md px-3 py-2 text-sm focus:outline-none ${
                      dark
                        ? "bg-gray-700 border border-gray-600 text-white placeholder:text-gray-500"
                        : "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400"
                    }`}
                  />
                </div>
                <div className="max-h-48 overflow-y-auto">
                  {filteredCountries.map((country) => (
                    <div
                      key={country.code}
                      onClick={() => {
                        setSelectedCountry(country);
                        setShowDropdown(false);
                        setCountrySearch("");
                      }}
                      className={dropdownItemClass}
                    >
                      <span className="text-lg leading-none">{country.flag}</span>
                      <span className="flex-1 truncate">{country.name}</span>
                      <span className={`font-mono text-xs ${dark ? "text-gray-400" : "text-gray-400"}`}>
                        {country.dial}
                      </span>
                    </div>
                  ))}
                  {filteredCountries.length === 0 && (
                    <p className={`px-3 py-2 text-sm ${dark ? "text-gray-500" : "text-gray-400"}`}>
                      Aucun pays trouvé
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Phone input */}
          <input
            type="tel"
            id="phone"
            value={phone}
            onChange={(e) => {
              const val = e.target.value.replace(/[^\d\s]/g, "");
              setPhone(val);
            }}
            placeholder={selectedCountry.code === "BJ" ? "01 23 45 67 89" : "77 123 45 67"}
            className={inputClass}
            style={{ "--tw-ring-color": config.primary_color } as React.CSSProperties}
          />
        </div>
        <p className={`text-xs mt-1 ${dark ? "text-gray-500" : "text-gray-400"}`}>
          De préférence votre numéro WhatsApp
        </p>
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
            Traitement...
          </span>
        ) : (
          config.cta_text
        )}
      </button>
    </form>
  );
}
