"use client";

import { useEffect, useState } from "react";

interface StickyMobileCTAProps {
  price: string;
  ctaText: string;
  color: string;
  onCtaClick: () => void;
  loading?: boolean;
}

export function StickyMobileCTA({
  price,
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
      <div
        className="bg-white border-t border-gray-200 px-4 py-3 flex items-center gap-3 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]"
      >
        <div className="shrink-0">
          <p className="text-xl font-black" style={{ color }}>
            {price}
          </p>
        </div>
        <button
          onClick={onCtaClick}
          disabled={loading}
          className="flex-1 rounded-xl py-3 text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: color }}
        >
          {loading ? "Traitement..." : ctaText}
        </button>
      </div>
    </div>
  );
}
