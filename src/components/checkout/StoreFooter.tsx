"use client";

import { useState } from "react";

interface StoreFooterProps {
  storeName: string;
  dark?: boolean;
}

const TRANSLATIONS = {
  fr: {
    disclaimer:
      "Ce site web n'est en aucun cas affilié à Facebook ou Meta. Nous utilisons la publicité pour promouvoir notre contenu et nos produits/services à un public plus large. Les informations fournies sur ce site sont à titre informatif uniquement et ne constituent pas un conseil professionnel ou financier.",
    rights: "Tous droits réservés.",
    poweredBy: "Propulsé par",
  },
  en: {
    disclaimer:
      "This website is in no way affiliated with Facebook or Meta. We use advertising to promote our content and products/services to a wider audience. The information provided on this site is for informational purposes only and does not constitute professional or financial advice.",
    rights: "All rights reserved.",
    poweredBy: "Powered by",
  },
};

export function StoreFooter({ storeName, dark }: StoreFooterProps) {
  const [lang, setLang] = useState<"fr" | "en">("fr");
  const t = TRANSLATIONS[lang];
  const year = new Date().getFullYear();

  return (
    <footer
      className={`border-t mt-auto ${
        dark
          ? "bg-gray-950 border-white/5 text-gray-500"
          : "bg-gray-50 border-gray-200 text-gray-400"
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Meta disclaimer */}
        <p className="text-xs leading-relaxed">{t.disclaimer}</p>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-inherit">
          {/* Copyright */}
          <p className="text-xs">
            &copy; {year} {storeName}. {t.rights}
          </p>

          <div className="flex items-center gap-4">
            {/* Language toggle */}
            <div
              className={`flex items-center rounded-full text-xs overflow-hidden border ${
                dark ? "border-white/10" : "border-gray-200"
              }`}
            >
              <button
                onClick={() => setLang("fr")}
                className={`px-2.5 py-1 transition-colors ${
                  lang === "fr"
                    ? dark
                      ? "bg-white/10 text-white"
                      : "bg-gray-200 text-gray-700"
                    : dark
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                FR
              </button>
              <button
                onClick={() => setLang("en")}
                className={`px-2.5 py-1 transition-colors ${
                  lang === "en"
                    ? dark
                      ? "bg-white/10 text-white"
                      : "bg-gray-200 text-gray-700"
                    : dark
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                EN
              </button>
            </div>

            {/* Powered by */}
            <p className="text-xs">
              {t.poweredBy}{" "}
              <span className={`font-semibold ${dark ? "text-gray-400" : "text-gray-500"}`}>
                MerrickDev
              </span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
