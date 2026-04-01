"use client";

import { useEffect, useState, useCallback } from "react";
import type { SalesPopupConfig } from "@/lib/api";
import type { Locale } from "@/lib/i18n";

interface SalesPopupProps {
  config: SalesPopupConfig;
  productName: string;
  dark?: boolean;
  locale?: Locale;
}

const txt = {
  someone: { fr: "Quelqu'un", en: "Someone" },
  from: { fr: "de", en: "from" },
  just_bought: { fr: "vient d'acheter", en: "just bought" },
  ago: { fr: "il y a", en: "" },
  min: { fr: "min", en: "min ago" },
};

function getFlag(code?: string): string | null {
  if (!code || code.length !== 2) return null;
  const offset = 0x1F1E6 - 65;
  return String.fromCodePoint(
    code.toUpperCase().charCodeAt(0) + offset,
    code.toUpperCase().charCodeAt(1) + offset,
  );
}

export function SalesPopup({ config, productName, dark, locale = 'fr' }: SalesPopupProps) {
  const [visible, setVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<{ name: string; city: string; country?: string } | null>(null);
  const [minutesAgo, setMinutesAgo] = useState(0);

  const entries = config.entries;
  const interval = (Number(config.interval_seconds) || 8) * 1000;
  const showName = config.show_name !== false;

  const showNext = useCallback(() => {
    if (!entries || entries.length === 0) return;

    const randomIndex = Math.floor(Math.random() * entries.length);
    const randomMinutes = Math.floor(Math.random() * 30) + 1;

    setCurrentEntry(entries[randomIndex]);
    setMinutesAgo(randomMinutes);
    setVisible(true);

    setTimeout(() => setVisible(false), 4000);
  }, [entries]);

  useEffect(() => {
    if (!config.enabled || !entries || entries.length === 0) return;

    const initialTimeout = setTimeout(showNext, 3000);
    const loop = setInterval(showNext, interval + 4000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(loop);
    };
  }, [config.enabled, entries, interval, showNext]);

  if (!config.enabled || !entries || entries.length === 0) return null;
  if (!currentEntry) return null;

  const displayName = showName ? currentEntry.name : txt.someone[locale];
  const truncatedProduct = productName.length > 30 ? productName.slice(0, 30) + "..." : productName;
  const timeAgo = locale === 'en'
    ? `${minutesAgo} ${txt.min[locale]}`
    : `${txt.ago[locale]} ${minutesAgo} ${txt.min[locale]}`;

  return (
    <>
      {/* Mobile: notification en haut, compacte */}
      <div
        className={`fixed top-2 left-2 right-2 z-50 md:hidden transition-all duration-500 ${
          visible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`rounded-lg px-3 py-2 shadow-lg flex items-center gap-2 ${
            dark ? "bg-gray-800 border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-800"
          }`}
        >
          {getFlag(currentEntry.country) ? (
            <span className="text-lg shrink-0">{getFlag(currentEntry.country)}</span>
          ) : (
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-[10px] shrink-0">
              {showName ? currentEntry.name.charAt(0).toUpperCase() : "?"}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p className="text-xs leading-tight">
              <span className="font-semibold">{displayName}</span>{" "}
              <span className={dark ? "text-gray-400" : "text-gray-500"}>
                {txt.from[locale]} {currentEntry.city}
              </span>
            </p>
            <p className={`text-[11px] leading-tight mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>
              {txt.just_bought[locale]} <span className="font-medium">{truncatedProduct}</span>
              {" · "}{timeAgo}
            </p>
          </div>

          <span className="relative flex h-2 w-2 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        </div>
      </div>

      {/* Desktop: popup en bas à gauche */}
      <div
        className={`fixed bottom-4 left-4 z-40 hidden md:block transition-all duration-500 max-w-xs ${
          visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div
          className={`rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3 ${
            dark ? "bg-gray-800 border border-white/10 text-white" : "bg-white border border-gray-200 text-gray-800"
          }`}
        >
          {getFlag(currentEntry.country) ? (
            <span className="text-2xl shrink-0">{getFlag(currentEntry.country)}</span>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {showName ? currentEntry.name.charAt(0).toUpperCase() : "?"}
            </div>
          )}

          <div className="min-w-0">
            <p className="text-sm font-semibold leading-tight">
              {displayName}{" "}
              <span className={dark ? "text-gray-400 font-normal" : "text-gray-500 font-normal"}>
                {txt.from[locale]} {currentEntry.city}
              </span>
            </p>
            <p className={`text-xs mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>
              {txt.just_bought[locale]}{" "}
              <span className="font-medium">{truncatedProduct}</span>
            </p>
            <p className={`text-xs mt-1 ${dark ? "text-gray-500" : "text-gray-400"}`}>
              {timeAgo}
            </p>
          </div>

          <span className="relative flex h-2 w-2 shrink-0 mt-1">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
          </span>
        </div>
      </div>
    </>
  );
}
