<?php

namespace App\Services\Payment;

class PaymentResult
{
    public function __construct(
        public readonly bool $success,
        public readonly string $status, // processing, completed, failed, redirect
        public readonly ?string $providerRef = null,
        public readonly ?string $providerName = null,
        public readonly ?string $redirectUrl = null,
        public readonly ?string $errorMessage = null,
        public readonly array $meta = [],
    ) {}

    public static function processing(string $providerName, string $providerRef, array $meta = []): self
    {
        return new self(
            success: true,
            status: 'processing',
            providerRef: $providerRef,
            providerName: $providerName,
            meta: $meta,
        );
    }

    public static function redirect(string $providerName, string $providerRef, string $redirectUrl): self
    {
        return new self(
            success: true,
            status: 'redirect',
            providerRef: $providerRef,
            providerName: $providerName,
            redirectUrl: $redirectUrl,
        );
    }

    /**
     * Le provider attend un code OTP du client (ex: PayDunya OPR).
     * meta doit contenir 'opr_token' pour la confirmation.
     */
    public static function otpRequired(string $providerName, string $providerRef, array $meta = []): self
    {
        return new self(
            success: true,
            status: 'otp_required',
            providerRef: $providerRef,
            providerName: $providerName,
            meta: $meta,
        );
    }

    public static function failed(string $providerName, string $errorMessage): self
    {
        return new self(
            success: false,
            status: 'failed',
            providerName: $providerName,
            errorMessage: $errorMessage,
        );
    }
}
