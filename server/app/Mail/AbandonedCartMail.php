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

    // Type: reminder_1, reminder_2, reminder_3
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
        public int $reminderNumber = 1,
    ) {}

    public function envelope(): Envelope
    {
        $subjects = [
            'fr' => [
                1 => "Vous n'avez pas termine votre achat — {$this->productName}",
                2 => $this->promoCode
                    ? "Votre code promo vous attend — {$this->productName}"
                    : "Votre panier vous attend — {$this->productName}",
                3 => "Derniere chance — {$this->productName}",
            ],
            'en' => [
                1 => "You didn't finish your purchase — {$this->productName}",
                2 => $this->promoCode
                    ? "Your discount code is waiting — {$this->productName}"
                    : "Your cart is waiting — {$this->productName}",
                3 => "Last chance — {$this->productName}",
            ],
        ];

        $locale = $this->storeLocale === 'en' ? 'en' : 'fr';
        $subject = $subjects[$locale][$this->reminderNumber] ?? $subjects[$locale][1];

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
