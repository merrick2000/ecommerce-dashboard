@php
$t = [
    'fr' => [
        'confirmed' => 'Paiement confirmé !',
        'hello' => 'Bonjour',
        'thanks' => 'Merci pour votre achat ! Votre commande a bien été confirmée.',
        'product' => 'Produit',
        'amount' => 'Montant',
        'order' => 'Commande',
        'access' => 'Accéder à mon produit',
        'private_link' => 'Ce lien est personnel, ne le partagez pas.',
        'sent_by' => 'Envoyé par',
        'via' => 'via Sellit',
    ],
    'en' => [
        'confirmed' => 'Payment confirmed!',
        'hello' => 'Hello',
        'thanks' => 'Thank you for your purchase! Your order has been confirmed.',
        'product' => 'Product',
        'amount' => 'Amount',
        'order' => 'Order',
        'access' => 'Access my product',
        'private_link' => 'This link is personal, do not share it.',
        'sent_by' => 'Sent by',
        'via' => 'via Sellit',
    ],
];
$l = $t[$storeLocale] ?? $t['fr'];
@endphp
<!DOCTYPE html>
<html lang="{{ $storeLocale }}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-text-size-adjust: 100%;">
    <div style="width: 100%; max-width: 480px; margin: 0 auto; padding: 24px 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="font-size: 18px; font-weight: 700; color: #18181b; margin: 0;">{{ $storeName }}</h1>
        </div>

        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="background: #10b981; padding: 20px; text-align: center;">
                <div style="font-size: 28px; margin-bottom: 6px;">&#10003;</div>
                <h2 style="color: white; font-size: 16px; font-weight: 700; margin: 0;">{{ $l['confirmed'] }}</h2>
            </div>

            <div style="padding: 20px 16px;">
                <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    {{ $l['hello'] }} <strong>{{ $order->customer_name ?? 'Client' }}</strong>,<br>
                    {{ $l['thanks'] }}
                </p>

                <div style="background: #fafafa; border-radius: 10px; padding: 14px; margin-bottom: 20px;">
                    <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e5e5;">
                        <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">{{ $l['product'] }}</div>
                        <div style="color: #18181b; font-size: 14px; font-weight: 600; margin-top: 2px; word-break: break-word;">{{ $productName }}</div>
                    </div>
                    <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #e5e5e5;">
                        <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">{{ $l['amount'] }}</div>
                        <div style="color: #18181b; font-size: 14px; font-weight: 600; margin-top: 2px;">{{ number_format($order->amount, 0, ',', ' ') }} {{ $order->currency }}</div>
                    </div>
                    <div>
                        <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">{{ $l['order'] }}</div>
                        <div style="color: #18181b; font-size: 14px; font-weight: 600; margin-top: 2px;">{{ $order->order_number }}</div>
                    </div>
                </div>

                @if($downloadUrl)
                <div style="text-align: center; margin-bottom: 16px;">
                    <a href="{{ $downloadUrl }}" style="display: inline-block; background: #18181b; color: white; font-size: 14px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 10px;">
                        {{ $l['access'] }}
                    </a>
                </div>
                <p style="color: #a1a1aa; font-size: 11px; text-align: center; margin: 0;">{{ $l['private_link'] }}</p>
                @endif
            </div>
        </div>

        <div style="text-align: center; margin-top: 24px;">
            <p style="color: #a1a1aa; font-size: 11px; margin: 0;">{{ $l['sent_by'] }} {{ $storeName }} {{ $l['via'] }}</p>
        </div>
    </div>
</body>
</html>
