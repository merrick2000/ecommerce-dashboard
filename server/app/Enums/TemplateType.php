<?php

namespace App\Enums;

enum TemplateType: string
{
    case CLASSIC = 'CLASSIC';
    case DARK_PREMIUM = 'DARK_PREMIUM';
    case MINIMALIST_CARD = 'MINIMALIST_CARD';

    public function label(): string
    {
        return match ($this) {
            self::CLASSIC => 'Classic',
            self::DARK_PREMIUM => 'Dark Premium',
            self::MINIMALIST_CARD => 'Minimalist Card',
        };
    }
}
