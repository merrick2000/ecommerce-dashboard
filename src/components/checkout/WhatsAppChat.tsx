"use client";

import { useState, useRef, useEffect } from "react";
import type { Locale } from "@/lib/i18n";

interface WhatsAppChatProps {
  phone: string;
  welcomeMessage?: string;
  productName: string;
  locale?: Locale;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  paymentLink?: string | null;
  paymentMode?: 'native' | 'external_link';
  formattedPrice?: string;
  features?: string[];
}

type ChatBubble = {
  from: 'bot' | 'user';
  text?: string;
  html?: string;
  delay?: number;
};

const positionClasses = {
  'bottom-right': 'bottom-20 md:bottom-4 right-4',
  'bottom-left': 'bottom-20 md:bottom-4 left-4',
  'top-right': 'top-20 right-4',
  'top-left': 'top-20 left-4',
};

const txt = {
  fr: {
    placeholder: "Tapez votre message...",
    powered: "Propulse par WhatsApp",
    repliesInstantly: "Repond generalement instantanement",
    // Quick replies
    wantToBuy: "Je veux acheter",
    haveQuestion: "J'ai une question",
    whatDoIGet: "J'obtiens quoi si je paye ?",
    stillAvailable: "Encore disponible ?",
    // Bot responses - buy
    buyUserMsg: "Je veux acheter ce produit",
    buyBot1: "Excellent choix ! 🔥",
    buyBot2: (price: string) => `Le prix actuel est de <strong>${price}</strong> — mais attention, cette offre est <strong>limitee dans le temps</strong>.`,
    buyBot3: "Ne tardez pas, les places partent vite ! Cliquez ci-dessous pour securiser votre achat 👇",
    payNow: "Payer maintenant",
    goToForm: "Acheter maintenant",
    nativeBot: "Remplissez le formulaire juste en dessous et cliquez sur le bouton pour securiser votre place !",
    // Bot responses - what do I get
    getUserMsg: "J'obtiens quoi exactement si je paye ?",
    getBot1: "Super question ! 😊",
    getBot2: (name: string) => `En achetant <strong>${name}</strong>, vous recevez <strong>immediatement</strong> votre produit par email.`,
    getBot3Features: "Voici ce qui est inclus :",
    getBot4: "Vous avez un acces <strong>a vie</strong>, sans frais supplementaires. Et si vous n'etes pas satisfait, nous sommes la pour vous aider. 🤝",
    // Bot responses - question
    questionUserMsg: "J'ai une question sur ce produit",
    questionBot: "Bien sur ! Posez votre question ici et nous vous repondrons au plus vite sur WhatsApp 👇",
    // Bot responses - available
    availableUserMsg: "Ce produit est toujours disponible ?",
    availableBot1: "Oui, il est encore disponible ! ✅",
    availableBot2: (price: string) => `Mais a ce prix de <strong>${price}</strong>, ca ne va pas durer. On a deja eu beaucoup de demandes recemment.`,
    availableBot3: "Je vous conseille de ne pas attendre 😉",
  },
  en: {
    placeholder: "Type your message...",
    powered: "Powered by WhatsApp",
    repliesInstantly: "Usually replies instantly",
    wantToBuy: "I want to buy",
    haveQuestion: "I have a question",
    whatDoIGet: "What do I get?",
    stillAvailable: "Still available?",
    buyUserMsg: "I want to buy this product",
    buyBot1: "Excellent choice! 🔥",
    buyBot2: (price: string) => `The current price is <strong>${price}</strong> — but be quick, this offer is <strong>limited time only</strong>.`,
    buyBot3: "Don't wait, spots are filling up fast! Click below to secure your purchase 👇",
    payNow: "Pay now",
    goToForm: "Buy now",
    nativeBot: "Fill in the form below and click the buy button to secure your spot!",
    getUserMsg: "What exactly do I get if I pay?",
    getBot1: "Great question! 😊",
    getBot2: (name: string) => `By purchasing <strong>${name}</strong>, you get <strong>instant</strong> access delivered to your email.`,
    getBot3Features: "Here is what is included:",
    getBot4: "You get <strong>lifetime access</strong>, no extra fees. And if you are not satisfied, we are here to help. 🤝",
    questionUserMsg: "I have a question about this product",
    questionBot: "Of course! Ask your question here and we will reply on WhatsApp as soon as possible 👇",
    availableUserMsg: "Is this product still available?",
    availableBot1: "Yes, it is still available! ✅",
    availableBot2: (price: string) => `But at this price of <strong>${price}</strong>, it won't last long. We have had a lot of interest recently.`,
    availableBot3: "I'd recommend not waiting 😉",
  },
};

export function WhatsAppChat({
  phone, welcomeMessage, productName, locale = "fr", position = "bottom-right",
  paymentLink, paymentMode, formattedPrice, features,
}: WhatsAppChatProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [typing, setTyping] = useState(false);
  const [quickRepliesVisible, setQuickRepliesVisible] = useState(true);
  const ref = useRef<HTMLDivElement>(null);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const t = txt[locale] || txt.fr;
  const cleanPhone = phone.replace(/[^0-9+]/g, "").replace(/^\+/, "");

  const defaultWelcome = locale === "en"
    ? `Hi! Have a question about *${productName}*? I'm here to help!`
    : `Bonjour ! Une question sur *${productName}* ? Je suis la pour vous aider !`;
  const welcome = welcomeMessage || defaultWelcome;

  // Scroll to bottom when new bubbles arrive
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [bubbles, typing]);

  const addBubblesSequentially = (newBubbles: ChatBubble[]) => {
    setQuickRepliesVisible(false);
    let totalDelay = 0;

    newBubbles.forEach((bubble, i) => {
      const delay = bubble.delay ?? (bubble.from === 'bot' ? 800 + i * 600 : 0);
      totalDelay += delay;

      if (bubble.from === 'bot' && i > 0) {
        setTimeout(() => setTyping(true), totalDelay - 500);
      }

      setTimeout(() => {
        setTyping(false);
        setBubbles(prev => [...prev, bubble]);
      }, totalDelay);
    });

    // Show quick replies again after all bubbles
    setTimeout(() => setQuickRepliesVisible(true), totalDelay + 300);
  };

  const handleBuy = () => {
    const price = formattedPrice || "---";
    const flow: ChatBubble[] = [
      { from: 'user', text: t.buyUserMsg, delay: 0 },
      { from: 'bot', text: t.buyBot1 },
      { from: 'bot', html: t.buyBot2(price) },
      { from: 'bot', text: t.buyBot3 },
    ];
    addBubblesSequentially(flow);
  };

  const handleWhatDoIGet = () => {
    const flow: ChatBubble[] = [
      { from: 'user', text: t.getUserMsg, delay: 0 },
      { from: 'bot', text: t.getBot1 },
      { from: 'bot', html: t.getBot2(productName) },
    ];
    if (features && features.length > 0) {
      flow.push({
        from: 'bot',
        html: `${t.getBot3Features}<br/>${features.map(f => `✅ ${f}`).join('<br/>')}`,
      });
    }
    flow.push({ from: 'bot', html: t.getBot4 });
    addBubblesSequentially(flow);
  };

  const handleQuestion = () => {
    addBubblesSequentially([
      { from: 'user', text: t.questionUserMsg, delay: 0 },
      { from: 'bot', text: t.questionBot },
    ]);
  };

  const handleAvailable = () => {
    const price = formattedPrice || "---";
    addBubblesSequentially([
      { from: 'user', text: t.availableUserMsg, delay: 0 },
      { from: 'bot', text: t.availableBot1 },
      { from: 'bot', html: t.availableBot2(price) },
      { from: 'bot', text: t.availableBot3 },
    ]);
  };

  const handleSend = () => {
    const prefilledText = locale === "en"
      ? `Hi, I have a question about *${productName}*: ${message}`
      : `Bonjour, j'ai une question sur *${productName}* : ${message}`;
    const text = message.trim() ? prefilledText : (
      locale === "en"
        ? `Hi, I'm interested in *${productName}*`
        : `Bonjour, je suis interesse(e) par *${productName}*`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, "_blank");
    setMessage("");
  };

  const handleReset = () => {
    setOpen(false);
    setBubbles([]);
    setTyping(false);
    setQuickRepliesVisible(true);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const time = new Date().toLocaleTimeString(locale === "en" ? "en" : "fr", { hour: "2-digit", minute: "2-digit" });

  // Check if last bot message was the buy flow (to show CTA)
  const lastBubble = bubbles[bubbles.length - 1];
  const showPaymentCta = lastBubble?.from === 'bot' && lastBubble?.text === t.buyBot3;
  const showFormCta = showPaymentCta && paymentMode !== 'external_link';
  const showExternalCta = showPaymentCta && paymentMode === 'external_link' && paymentLink;

  return (
    <div ref={ref} className={`fixed ${positionClasses[position]} z-50`}>
      {open && (
        <div className="mb-3 w-[320px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <WhatsAppIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm truncate">{productName}</p>
              <p className="text-green-200 text-xs">{t.repliesInstantly}</p>
            </div>
            <button onClick={handleReset} className="text-white/70 hover:text-white">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chat body */}
          <div ref={chatBodyRef} className="bg-[#ECE5DD] p-3 space-y-2 max-h-[320px] overflow-y-auto">
            {/* Welcome */}
            <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[85%]">
              <p className="text-sm text-gray-800 whitespace-pre-line">{welcome}</p>
              <p className="text-[10px] text-gray-400 text-right mt-1">{time}</p>
            </div>

            {/* Dynamic bubbles */}
            {bubbles.map((b, i) => (
              <div key={i} className={b.from === 'user' ? 'flex justify-end' : ''}>
                <div className={`rounded-lg p-3 shadow-sm max-w-[85%] ${
                  b.from === 'user'
                    ? 'bg-[#DCF8C6] rounded-tr-none'
                    : 'bg-white rounded-tl-none'
                }`}>
                  {b.html ? (
                    <p className="text-sm text-gray-800" dangerouslySetInnerHTML={{ __html: b.html }} />
                  ) : (
                    <p className="text-sm text-gray-800">{b.text}</p>
                  )}
                </div>
              </div>
            ))}

            {/* Payment CTAs after buy flow */}
            {showExternalCta && (
              <div className="pl-0 max-w-[85%]">
                <a
                  href={paymentLink!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-[#25D366] text-white text-center text-sm font-bold py-2.5 px-4 rounded-lg hover:bg-[#20BD5A] transition-colors"
                >
                  {t.payNow} →
                </a>
              </div>
            )}
            {showFormCta && (
              <div className="pl-0 max-w-[85%] space-y-2">
                <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm">
                  <p className="text-sm text-gray-800">{t.nativeBot}</p>
                </div>
                <button
                  onClick={() => {
                    setOpen(false);
                    document.getElementById("checkout-form")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full bg-[#25D366] text-white text-center text-sm font-bold py-2.5 px-4 rounded-lg hover:bg-[#20BD5A] transition-colors"
                >
                  {t.goToForm} ↓
                </button>
              </div>
            )}

            {/* Typing indicator */}
            {typing && (
              <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm max-w-[60px]">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Quick replies */}
            {quickRepliesVisible && !typing && (
              <div className="flex flex-wrap gap-1.5 justify-end pt-1">
                <button onClick={handleBuy} className="bg-white border border-[#25D366] text-[#25D366] text-xs font-medium px-3 py-1.5 rounded-full hover:bg-[#25D366] hover:text-white transition-colors">
                  {t.wantToBuy} 💰
                </button>
                <button onClick={handleWhatDoIGet} className="bg-white border border-gray-300 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
                  {t.whatDoIGet} 🎁
                </button>
                <button onClick={handleQuestion} className="bg-white border border-gray-300 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
                  {t.haveQuestion} 💬
                </button>
                <button onClick={handleAvailable} className="bg-white border border-gray-300 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
                  {t.stillAvailable} ✅
                </button>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t.placeholder}
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
            <p className="text-[10px] text-gray-400 text-center mt-2">{t.powered}</p>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        onClick={() => { if (open) handleReset(); else setOpen(true); }}
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
