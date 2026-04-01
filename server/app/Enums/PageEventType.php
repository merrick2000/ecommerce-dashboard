<?php

namespace App\Enums;

enum PageEventType: string
{
    case PAGE_VIEW = 'page_view';
    case SCROLL_DEPTH = 'scroll_depth';
    case CTA_CLICK = 'cta_click';
    case FORM_FOCUS = 'form_focus';
    case FORM_ABANDON = 'form_abandon';
    case CHECKOUT_INITIATE = 'checkout_initiate';
    case ORDER_CREATED = 'order_created';
    case PAYMENT_STARTED = 'payment_started';
    case PAYMENT_COMPLETED = 'payment_completed';
    case PAGE_LEAVE = 'page_leave';
    case PROMO_CLICK = 'promo_click';
    case JS_ERROR = 'js_error';
    case DOWNLOAD = 'download';

    public function label(): string
    {
        return match ($this) {
            self::PAGE_VIEW => 'Vue de page',
            self::SCROLL_DEPTH => 'Profondeur scroll',
            self::CTA_CLICK => 'Clic CTA',
            self::FORM_FOCUS => 'Focus formulaire',
            self::FORM_ABANDON => 'Abandon formulaire',
            self::CHECKOUT_INITIATE => 'Début checkout',
            self::ORDER_CREATED => 'Commande créée',
            self::PAYMENT_STARTED => 'Paiement initié',
            self::PAYMENT_COMPLETED => 'Paiement complété',
            self::PAGE_LEAVE => 'Quitte la page',
            self::PROMO_CLICK => 'Clic promo abandon',
            self::JS_ERROR => 'Erreur JS',
            self::DOWNLOAD => 'Téléchargement',
        };
    }
}
