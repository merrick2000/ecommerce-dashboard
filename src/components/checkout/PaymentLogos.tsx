"use client";

interface PaymentLogosProps {
  dark?: boolean;
}

export function PaymentLogos({ dark }: PaymentLogosProps) {
  return (
    <div className="space-y-2">
      <p className={`text-xs font-medium text-center ${dark ? "text-gray-500" : "text-gray-400"}`}>
        Moyens de paiement acceptés
      </p>
      <div className="flex items-center justify-center gap-1 flex-wrap">
        <img
          src="/images/payment-methods/payment-cfa.png"
          alt="Paiements CFA"
          className={`h-6 object-contain ${dark ? "brightness-90" : ""}`}
        />
        <img
          src="/images/payment-methods/payment-ghs.png"
          alt="Paiements GHS"
          className={`h-6 object-contain ${dark ? "brightness-90" : ""}`}
        />
        <img
          src="/images/payment-methods/payment-kes.png"
          alt="Paiements KES"
          className={`h-6 object-contain ${dark ? "brightness-90" : ""}`}
        />
      </div>
    </div>
  );
}
