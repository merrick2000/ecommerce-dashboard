<?php

namespace App\Mail;

use App\Models\Lead;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AbandonedCartMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Lead $lead,
        public string $productName,
        public string $formattedPrice,
        public string $checkoutUrl,
        public string $storeName,
        public string $storeLocale = 'fr',
        public ?string $coverImage = null,
        public ?string $promoCode = null,
        public ?string $promoMessage = null,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->promoCode
            ? ($this->storeLocale === 'en'
                ? "Your discount code is waiting — {$this->productName}"
                : "Votre code promo vous attend — {$this->productName}")
            : ($this->storeLocale === 'en'
                ? "You didn't finish your purchase — {$this->productName}"
                : "Vous n'avez pas terminé votre achat — {$this->productName}");

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.abandoned-cart',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
