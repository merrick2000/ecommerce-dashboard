"use client";

import { useEffect, useState } from "react";
import type { UrgencyConfig } from "@/lib/api";

interface UrgencyWidgetsProps {
  urgencyConfig: UrgencyConfig;
  color: string;
  dark?: boolean;
}

export function UrgencyWidgets({ urgencyConfig, color, dark }: UrgencyWidgetsProps) {
  if (!urgencyConfig || typeof urgencyConfig !== "object") return null;

  const { countdown_timer, limited_spots, flash_sale, social_proof } = urgencyConfig;

  const hasAny =
    countdown_timer?.enabled ||
    limited_spots?.enabled ||
    flash_sale?.enabled ||
    social_proof?.enabled;

  if (!hasAny) return null;

  return (
    <div className="space-y-3 mb-6">
      {countdown_timer?.enabled && (
        <CountdownTimer
          durationMinutes={countdown_timer.duration_minutes || 15}
          label={countdown_timer.label || "Offre expire dans"}
          color={color}
          dark={dark}
        />
      )}
      {flash_sale?.enabled && (
        <FlashSaleBanner
          discountPercent={flash_sale.discount_percent || 30}
          durationMinutes={flash_sale.duration_minutes || 30}
          color={color}
          dark={dark}
        />
      )}
      {limited_spots?.enabled && (
        <LimitedSpots
          totalSpots={limited_spots.total_spots || 50}
          remainingSpots={limited_spots.remaining_spots || 12}
          color={color}
          dark={dark}
        />
      )}
      {social_proof?.enabled && (
        <SocialProof
          viewerCount={social_proof.viewer_count || 24}
          dark={dark}
        />
      )}
    </div>
  );
}

// ─── Compte à rebours ────────────────────────────────────────────────

function CountdownTimer({
  durationMinutes,
  label,
  color,
  dark,
}: {
  durationMinutes: number;
  label: string;
  color: string;
  dark?: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState((Number(durationMinutes) || 15) * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft === 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div
      className="rounded-xl px-4 py-3 text-center font-semibold text-sm flex items-center justify-center gap-2"
      style={{
        backgroundColor: dark ? color + "20" : color + "12",
        color: color,
        border: `1px solid ${color}30`,
      }}
    >
      <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
          clipRule="evenodd"
        />
      </svg>
      {label}{" "}
      <span className="font-mono text-base font-black">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

// ─── Offre flash ─────────────────────────────────────────────────────

function FlashSaleBanner({
  discountPercent,
  durationMinutes,
  color,
  dark,
}: {
  discountPercent: number;
  durationMinutes: number;
  color: string;
  dark?: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState((Number(durationMinutes) || 30) * 60);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (timeLeft === 0) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div
      className="rounded-xl px-4 py-3 text-center font-bold text-sm"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}CC)`,
        color: "#fff",
      }}
    >
      <span className="text-lg">OFFRE FLASH -{discountPercent}%</span>
      <span className="mx-2">|</span>
      Encore{" "}
      <span className="font-mono">
        {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

// ─── Places limitées ─────────────────────────────────────────────────

function LimitedSpots({
  totalSpots,
  remainingSpots,
  color,
  dark,
}: {
  totalSpots: number;
  remainingSpots: number;
  color: string;
  dark?: boolean;
}) {
  const total = Number(totalSpots) || 50;
  const remaining = Number(remainingSpots) || 12;
  const percentage = ((total - remaining) / total) * 100;

  return (
    <div
      className={`rounded-xl px-4 py-3 ${
        dark ? "bg-white/5 border border-white/10" : "bg-red-50 border border-red-100"
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-sm font-bold ${
            dark ? "text-red-400" : "text-red-600"
          }`}
        >
          Plus que {remaining} places disponibles !
        </span>
        <span
          className={`text-xs ${dark ? "text-gray-400" : "text-gray-500"}`}
        >
          {total - remaining}/{total} vendus
        </span>
      </div>
      <div
        className={`w-full h-2 rounded-full ${
          dark ? "bg-white/10" : "bg-red-100"
        }`}
      >
        <div
          className="h-2 rounded-full transition-all"
          style={{
            width: `${percentage}%`,
            backgroundColor: color,
          }}
        />
      </div>
    </div>
  );
}

// ─── Preuve sociale ──────────────────────────────────────────────────

function SocialProof({
  viewerCount,
  dark,
}: {
  viewerCount: number;
  dark?: boolean;
}) {
  const [count, setCount] = useState(Number(viewerCount) || 24);

  useEffect(() => {
    const interval = setInterval(() => {
      const jitter = Math.floor(Math.random() * 7) - 3; // -3 à +3
      setCount((prev) => Math.max(1, prev + jitter));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm ${
        dark
          ? "bg-white/5 border border-white/10 text-gray-300"
          : "bg-orange-50 border border-orange-100 text-orange-700"
      }`}
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
      </span>
      <span className="font-semibold">{count} personnes</span> regardent ce
      produit en ce moment
    </div>
  );
}
