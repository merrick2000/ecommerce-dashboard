<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public string $downloadUrl,
        public string $storeName,
        public string $productName,
        public string $storeLocale = 'fr',
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->storeLocale === 'en'
            ? "Your purchase: {$this->productName}"
            : "Votre achat : {$this->productName}";

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.order-confirmation',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
