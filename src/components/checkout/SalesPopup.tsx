"use client";

import { useEffect, useState, useCallback } from "react";
import type { SalesPopupConfig } from "@/lib/api";

interface SalesPopupProps {
  config: SalesPopupConfig;
  productName: string;
  dark?: boolean;
}

export function SalesPopup({ config, productName, dark }: SalesPopupProps) {
  const [visible, setVisible] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<{ name: string; city: string } | null>(null);
  const [minutesAgo, setMinutesAgo] = useState(0);

  const entries = config.entries;
  const interval = (Number(config.interval_seconds) || 8) * 1000;

  const showNext = useCallback(() => {
    if (!entries || entries.length === 0) return;

    const randomIndex = Math.floor(Math.random() * entries.length);
    const randomMinutes = Math.floor(Math.random() * 30) + 1;

    setCurrentEntry(entries[randomIndex]);
    setMinutesAgo(randomMinutes);
    setVisible(true);

    // Hide after 4 seconds
    setTimeout(() => setVisible(false), 4000);
  }, [entries]);

  useEffect(() => {
    if (!config.enabled || !entries || entries.length === 0) return;

    // First popup after 3 seconds
    const initialTimeout = setTimeout(showNext, 3000);

    // Then repeat
    const loop = setInterval(showNext, interval + 4000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(loop);
    };
  }, [config.enabled, entries, interval, showNext]);

  if (!config.enabled || !entries || entries.length === 0) return null;
  if (!currentEntry) return null;

  return (
    <div
      className={`fixed bottom-20 md:bottom-4 left-4 z-40 transition-all duration-500 max-w-xs ${
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none"
      }`}
    >
      <div
        className={`rounded-xl px-4 py-3 shadow-2xl flex items-start gap-3 ${
          dark
            ? "bg-gray-800 border border-white/10 text-white"
            : "bg-white border border-gray-200 text-gray-800"
        }`}
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
          {currentEntry.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">
            {currentEntry.name}{" "}
            <span className={dark ? "text-gray-400 font-normal" : "text-gray-500 font-normal"}>
              de {currentEntry.city}
            </span>
          </p>
          <p className={`text-xs mt-0.5 ${dark ? "text-gray-400" : "text-gray-500"}`}>
            vient d&apos;acheter{" "}
            <span className="font-medium">{productName.length > 30 ? productName.slice(0, 30) + "..." : productName}</span>
          </p>
          <p className={`text-xs mt-1 ${dark ? "text-gray-500" : "text-gray-400"}`}>
            il y a {minutesAgo} min
          </p>
        </div>

        {/* Green dot */}
        <span className="relative flex h-2 w-2 shrink-0 mt-1">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
        </span>
      </div>
    </div>
  );
}
