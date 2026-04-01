<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    public static function send(string $message): void
    {
        $token = config('services.telegram.bot_token');
        $chatId = config('services.telegram.chat_id');

        if (! $token || ! $chatId) {
            return;
        }

        try {
            Http::post("https://api.telegram.org/bot{$token}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => true,
            ]);
        } catch (\Exception $e) {
            Log::warning('Telegram notification failed: ' . $e->getMessage());
        }
    }

    public static function notifySale(string $productName, float $amount, string $currency, string $customerEmail, string $source = 'native'): void
    {
        $msg = "💰 <b>Nouvelle vente !</b>\n\n"
            . "📦 {$productName}\n"
            . "💵 " . number_format($amount, floor($amount) == $amount ? 0 : 2, '.', ' ') . " {$currency}\n"
            . "👤 {$customerEmail}\n"
            . "📍 {$source}";

        static::send($msg);
    }

    public static function notifyLead(string $productName, string $email): void
    {
        $msg = "🎯 <b>Nouveau lead</b>\n\n"
            . "📦 {$productName}\n"
            . "📧 {$email}";

        static::send($msg);
    }
}
