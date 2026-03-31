<?php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewSaleNotificationMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public string $productName,
        public string $storeName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Nouvelle vente : {$this->productName} — {$this->order->formatted_amount}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.new-sale-notification',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
