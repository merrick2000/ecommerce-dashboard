<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PENDING = 'pending';
    case PAID = 'paid';
    case FAILED = 'failed';
    case REFUNDED = 'refunded';

    public function label(): string
    {
        return match ($this) {
            self::PENDING => 'En attente',
            self::PAID => 'Payé',
            self::FAILED => 'Échoué',
            self::REFUNDED => 'Remboursé',
        };
    }
}
