<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class MilestoneReachedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public int $milestone,
        public string $storeName,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "{$this->milestone} visiteurs atteints — {$this->storeName}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.milestone-reached',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
