"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { captureEvent } from "@/lib/posthog";
import {
  initiatePayment,
  checkPaymentStatus,
  confirmPaymentOtp,
  type CheckoutPageData,
  type PaymentCountry,
} from "@/lib/api";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface PaymentPageProps {
  data: CheckoutPageData;
  countries: Record<string, PaymentCountry>;
  orderId: number;
}

type PaymentStep = "form" | "otp" | "confirming" | "failed";

export function PaymentPage({ data, countries, orderId }: PaymentPageProps) {
  const { store, product, checkout_config: config } = data;
  const locale: Locale = store.locale || "fr";
  const router = useRouter();
  const color = config.primary_color;

  const [step, setStep] = useState<PaymentStep>("form");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [phone, setPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpFlow, setOtpFlow] = useState<"sms" | "ussd">("sms");
  const [ussdInstruction, setUssdInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const countryList = Object.entries(countries);
  const networks = selectedCountry ? countries[selectedCountry]?.networks || {} : {};
  const networkList = Object.entries(networks);

  // Auto-select first country
  useEffect(() => {
    if (countryList.length > 0 && !selectedCountry) {
      setSelectedCountry(countryList[0][0]);
    }
  }, [countryList, selectedCountry]);

  // Reset network when country changes
  useEffect(() => {
    setSelectedNetwork("");
  }, [selectedCountry]);

  // Auto-select first network
  useEffect(() => {
    if (networkList.length > 0 && !selectedNetwork) {
      setSelectedNetwork(networkList[0][0]);
    }
  }, [networkList, selectedNetwork]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      try {
        const result = await checkPaymentStatus(orderId);

        if (result.status === "paid") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          router.push(`/${store.slug}/success?order=${orderId}`);
        } else if (result.status === "failed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          captureEvent("payment_failed", {
            store_id: store.id,
            product_id: product.id,
          });
          setStep("failed");
        }
      } catch {
        // Silently retry
      }
    }, 5000);
  }, [orderId, router, store.slug, store.id, product.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await initiatePayment({
        order_id: orderId,
        country: selectedCountry,
        network: selectedNetwork,
        phone,
      });

      captureEvent("payment_initiated", {
        store_id: store.id,
        product_id: product.id,
        country: selectedCountry,
        network: selectedNetwork,
      });

      if (result.status === "otp_required") {
        if (result.otp_flow === "ussd_pre_otp") {
          setOtpFlow("ussd");
          setUssdInstruction(result.ussd_instruction || "");
        } else {
          setOtpFlow("sms");
        }
        setStep("otp");
      } else if (result.status === "redirect" && result.redirect_url) {
        // Ouvrir dans un nouvel onglet + polling
        window.open(result.redirect_url, "_blank");
        setStep("confirming");
        startPolling();
      } else {
        // Direct push (USSD)
        setStep("confirming");
        startPolling();
      }
    } catch (err) {
      captureEvent("exception", { error: String(err) });
      setError(err instanceof Error ? err.message : t("payment.failed", locale));
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await confirmPaymentOtp({
        order_id: orderId,
        otp_code: otpCode,
      });

      captureEvent("payment_otp_submitted", {
        store_id: store.id,
        product_id: product.id,
      });

      if (result.status === "paid") {
        router.push(`/${store.slug}/success?order=${orderId}`);
      } else {
        // En attente de confirmation finale
        setStep("confirming");
        startPolling();
      }
    } catch (err) {
      captureEvent("exception", { error: String(err) });
      setError(err instanceof Error ? err.message : t("payment.failed", locale));
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setStep("form");
    setError("");
    setOtpCode("");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Order summary card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {t("payment.summary", locale)}
          </h2>
          <div className="flex items-center gap-4">
            {product.cover_image && (
              <img
                src={product.cover_image}
                alt={product.name}
                className="w-14 h-14 rounded-xl object-cover"
              />
            )}
            <div className="flex-1 min-w-0">
              <p className="font-bold text-gray-900 truncate">{product.name}</p>
              <p className="text-sm text-gray-500">{store.name}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-black" style={{ color }}>
                {product.formatted_effective_price}
              </p>
              {product.has_promo && (
                <p className="text-xs text-gray-400 line-through">
                  {product.formatted_price}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Payment form / OTP / Confirming / Failed */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-6">
            {t("payment.title", locale)}
          </h1>

          {/* ─── STEP: FORM ─────────────────────────────────── */}
          {step === "form" && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Country selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("payment.select_country", locale)}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {countryList.map(([code, country]) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setSelectedCountry(code)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                        selectedCountry === code
                          ? "border-current bg-opacity-5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      style={
                        selectedCountry === code
                          ? { borderColor: color, backgroundColor: color + "08", color }
                          : undefined
                      }
                    >
                      <span className="text-base">{getFlag(code)}</span>
                      <span className={selectedCountry === code ? "" : "text-gray-700"}>
                        {country.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Network selector */}
              {networkList.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("payment.select_network", locale)}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {networkList.map(([key, label]) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedNetwork(key)}
                        className={`px-3 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          selectedNetwork === key
                            ? "border-current bg-opacity-5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                        style={
                          selectedNetwork === key
                            ? { borderColor: color, backgroundColor: color + "08", color }
                            : undefined
                        }
                      >
                        <span className={selectedNetwork === key ? "" : "text-gray-700"}>
                          {label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Phone input */}
              <div>
                <label htmlFor="pay-phone" className="block text-sm font-medium text-gray-700 mb-1.5">
                  {t("payment.phone", locale)}
                </label>
                <input
                  type="tel"
                  id="pay-phone"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
                  placeholder={t("payment.phone_placeholder", locale)}
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": color } as React.CSSProperties}
                />
                <p className="text-xs text-gray-400 mt-1">
                  {t("payment.phone_hint", locale)}
                </p>
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <button
                type="submit"
                disabled={loading || !selectedCountry || !selectedNetwork || !phone}
                className="w-full rounded-xl py-3.5 text-white font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: color }}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    {t("payment.processing", locale)}
                  </span>
                ) : (
                  `${t("payment.pay", locale)} ${product.formatted_effective_price}`
                )}
              </button>

              <SecurityBadge locale={locale} />
            </form>
          )}

          {/* ─── STEP: OTP ──────────────────────────────────── */}
          {step === "otp" && (
            <form onSubmit={handleOtpSubmit} className="space-y-5">
              <div className="text-center mb-2">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: color + "15" }}
                >
                  <svg className="w-8 h-8" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  {t("payment.otp_title", locale)}
                </h2>
                {otpFlow === "ussd" ? (
                  <div className="mt-2 space-y-2">
                    <p className="text-sm text-gray-500">
                      {locale === "fr"
                        ? "Composez ce code USSD sur votre téléphone Orange :"
                        : "Dial this USSD code on your Orange phone:"}
                    </p>
                    {ussdInstruction && (
                      <p className="text-lg font-mono font-bold text-gray-900 bg-gray-100 rounded-lg py-2 px-4 inline-block">
                        {ussdInstruction}
                      </p>
                    )}
                    <p className="text-sm text-gray-500">
                      {locale === "fr"
                        ? "Puis entrez le code de confirmation reçu ci-dessous."
                        : "Then enter the confirmation code you received below."}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">
                    {t("payment.otp_detail", locale)}
                  </p>
                )}
              </div>

              <div>
                <input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder={t("payment.otp_placeholder", locale)}
                  maxLength={6}
                  className="w-full rounded-xl border border-gray-300 px-4 py-4 text-center text-2xl font-bold tracking-[0.3em] text-gray-900 placeholder:text-gray-300 placeholder:tracking-normal placeholder:text-base placeholder:font-normal focus:outline-none focus:ring-2 focus:border-transparent"
                  style={{ "--tw-ring-color": color } as React.CSSProperties}
                  autoFocus
                />
              </div>

              {error && <p className="text-red-500 text-sm font-medium text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-full rounded-xl py-3.5 text-white font-bold text-lg transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: color }}
              >
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    {t("payment.processing", locale)}
                  </span>
                ) : (
                  t("payment.otp_submit", locale)
                )}
              </button>

              <SecurityBadge locale={locale} />
            </form>
          )}

          {/* ─── STEP: CONFIRMING ───────────────────────────── */}
          {step === "confirming" && (
            <div className="text-center py-8">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse"
                style={{ backgroundColor: color + "15" }}
              >
                <svg className="w-10 h-10" style={{ color }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {t("payment.confirm_phone", locale)}
              </h2>
              <p className="text-gray-500 text-sm mb-6 max-w-xs mx-auto">
                {t("payment.confirm_detail", locale)}
              </p>
              <div className="flex items-center justify-center gap-2 text-sm font-medium" style={{ color }}>
                <Spinner />
                {t("payment.waiting", locale)}
              </div>
            </div>
          )}

          {/* ─── STEP: FAILED ───────────────────────────────── */}
          {step === "failed" && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {t("payment.failed", locale)}
              </h2>
              <button
                onClick={handleRetry}
                className="mt-6 px-6 py-3 rounded-xl text-white font-bold text-sm transition-all hover:opacity-90"
                style={{ backgroundColor: color }}
              >
                {t("payment.retry", locale)}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-4">
          {t("footer.powered_by", locale)} <span className="font-semibold">Sellit</span>
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function SecurityBadge({ locale }: { locale: Locale }) {
  return (
    <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
      </svg>
      {t("payment.secure", locale)}
    </p>
  );
}

const FLAGS: Record<string, string> = {
  BJ: "\u{1F1E7}\u{1F1EF}",
  TG: "\u{1F1F9}\u{1F1EC}",
  SN: "\u{1F1F8}\u{1F1F3}",
  CI: "\u{1F1E8}\u{1F1EE}",
  BF: "\u{1F1E7}\u{1F1EB}",
  CM: "\u{1F1E8}\u{1F1F2}",
  CG: "\u{1F1E8}\u{1F1EC}",
  GH: "\u{1F1EC}\u{1F1ED}",
  NG: "\u{1F1F3}\u{1F1EC}",
  SL: "\u{1F1F8}\u{1F1F1}",
  GA: "\u{1F1EC}\u{1F1E6}",
  CD: "\u{1F1E8}\u{1F1E9}",
  ET: "\u{1F1EA}\u{1F1F9}",
  KE: "\u{1F1F0}\u{1F1EA}",
  RW: "\u{1F1F7}\u{1F1FC}",
  TZ: "\u{1F1F9}\u{1F1FF}",
  UG: "\u{1F1FA}\u{1F1EC}",
  LS: "\u{1F1F1}\u{1F1F8}",
  MW: "\u{1F1F2}\u{1F1FC}",
  MZ: "\u{1F1F2}\u{1F1FF}",
  ZM: "\u{1F1FF}\u{1F1F2}",
};

function getFlag(code: string): string {
  return FLAGS[code] || code;
}
