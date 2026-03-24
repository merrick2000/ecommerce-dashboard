<?php

namespace App\Enums;

enum PageEventType: string
{
    case PAGE_VIEW = 'page_view';
    case CHECKOUT_INITIATE = 'checkout_initiate';
    case ORDER_CREATED = 'order_created';
    case PAYMENT_STARTED = 'payment_started';
    case PAYMENT_COMPLETED = 'payment_completed';
    case DOWNLOAD = 'download';

    public function label(): string
    {
        return match ($this) {
            self::PAGE_VIEW => 'Vue de page',
            self::CHECKOUT_INITIATE => 'Début checkout',
            self::ORDER_CREATED => 'Commande créée',
            self::PAYMENT_STARTED => 'Paiement initié',
            self::PAYMENT_COMPLETED => 'Paiement complété',
            self::DOWNLOAD => 'Téléchargement',
        };
    }
}
