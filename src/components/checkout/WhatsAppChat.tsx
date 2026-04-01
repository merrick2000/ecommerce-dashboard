"use client";

import { useState, useRef, useEffect } from "react";
import type { Locale } from "@/lib/i18n";

interface WhatsAppChatProps {
  phone: string;
  welcomeMessage?: string;
  productName: string;
  locale?: Locale;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const txt = {
  placeholder: {
    fr: "Tapez votre message...",
    en: "Type your message...",
  },
  send: {
    fr: "Envoyer via WhatsApp",
    en: "Send via WhatsApp",
  },
  powered: {
    fr: "Propulsé par WhatsApp",
    en: "Powered by WhatsApp",
  },
};

const positionClasses = {
  'bottom-right': 'bottom-4 right-4',
  'bottom-left': 'bottom-4 left-4',
  'top-right': 'top-20 right-4',
  'top-left': 'top-20 left-4',
};

const popupOrigin = {
  'bottom-right': 'origin-bottom-right',
  'bottom-left': 'origin-bottom-left',
  'top-right': 'origin-top-right',
  'top-left': 'origin-top-left',
};

export function WhatsAppChat({ phone, welcomeMessage, productName, locale = "fr", position = "bottom-right" }: WhatsAppChatProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const defaultWelcome = locale === "en"
    ? `Hi! Have a question about *${productName}*? Write to us!`
    : `Bonjour ! Une question sur *${productName}* ? Écrivez-nous !`;

  const welcome = welcomeMessage || defaultWelcome;

  // Nettoyer le numéro
  const cleanPhone = phone.replace(/[^0-9+]/g, "").replace(/^\+/, "");

  const handleSend = () => {
    const prefilledText = locale === "en"
      ? `Hi, I have a question about *${productName}*: ${message}`
      : `Bonjour, j'ai une question sur *${productName}* : ${message}`;

    const text = message.trim() ? prefilledText : (
      locale === "en"
        ? `Hi, I'm interested in *${productName}*`
        : `Bonjour, je suis intéressé(e) par *${productName}*`
    );

    window.open(
      `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`,
      "_blank"
    );
    setMessage("");
    setOpen(false);
  };

  // Fermer au clic extérieur
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className={`fixed ${positionClasses[position]} z-50`}>
      {/* Popup */}
      {open && (
        <div className="mb-3 w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in slide-in-from-bottom-2">
          {/* Header */}
          <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <WhatsAppIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">{productName}</p>
              <p className="text-green-200 text-xs">
                {locale === "en" ? "Usually replies instantly" : "Répond généralement instantanément"}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/70 hover:text-white"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat body */}
          <div className="bg-[#ECE5DD] p-4 min-h-[120px]">
            {/* Welcome bubble */}
            <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%]">
              <p className="text-sm text-gray-800 whitespace-pre-line">{welcome}</p>
              <p className="text-[10px] text-gray-400 text-right mt-1">
                {new Date().toLocaleTimeString(locale === "en" ? "en" : "fr", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={txt.placeholder[locale]}
                className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-full focus:outline-none focus:ring-1 focus:ring-[#25D366]"
              />
              <button
                onClick={handleSend}
                className="w-10 h-10 bg-[#25D366] rounded-full flex items-center justify-center hover:bg-[#20BD5A] transition-colors shrink-0"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                </svg>
              </button>
            </div>
            <p className="text-[10px] text-gray-400 text-center mt-2">{txt.powered[locale]}</p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:bg-[#20BD5A] transition-all hover:scale-105"
        data-track-cta="whatsapp_chat"
      >
        {open ? (
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <WhatsAppIcon className="w-7 h-7 text-white" />
        )}
      </button>
    </div>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
