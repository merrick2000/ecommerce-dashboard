"use client";

import { useEffect, useState } from "react";

interface StickyMobileCTAProps {
  price: string;
  originalPrice?: string;
  hasPromo?: boolean;
  promoLabel?: string | null;
  ctaText: string;
  color: string;
  onCtaClick: () => void;
  loading?: boolean;
}

export function StickyMobileCTA({
  price,
  originalPrice,
  hasPromo,
  promoLabel,
  ctaText,
  color,
  onCtaClick,
  loading,
}: StickyMobileCTAProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="shrink-0">
          <p className="text-lg font-black leading-tight" style={{ color }}>
            {price}
          </p>
          {hasPromo && originalPrice && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 line-through">{originalPrice}</span>
              {promoLabel && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ backgroundColor: color + "15", color }}
                >
                  {promoLabel}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={onCtaClick}
          disabled={loading}
          className="flex-1 rounded-xl py-3 text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: color }}
        >
          {loading ? "..." : ctaText}
        </button>
      </div>
    </div>
  );
}
