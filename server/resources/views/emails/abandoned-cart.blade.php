@php
$t = [
    'fr' => [
        1 => [
            'title' => 'Vous avez oublie quelque chose ?',
            'body' => 'Vous avez commence l\'achat de <strong>' . $productName . '</strong> mais vous n\'avez pas termine.',
            'cta' => 'Terminer mon achat',
        ],
        2 => [
            'title' => 'Votre panier vous attend !',
            'body' => '<strong>' . $productName . '</strong> est toujours disponible. Ne passez pas a cote !',
            'cta' => $promoCode ? 'Utiliser mon code promo' : 'Reprendre mon achat',
        ],
        3 => [
            'title' => 'Derniere chance !',
            'body' => 'C\'est votre derniere relance. <strong>' . $productName . '</strong> ne sera peut-etre plus disponible a ce prix.',
            'cta' => $promoCode ? 'Profiter de l\'offre' : 'Acheter maintenant',
        ],
        'price' => 'Prix :',
        'your_code' => 'Votre code :',
        'auto_applied' => 'Le code sera applique automatiquement en cliquant sur le bouton.',
        'question' => 'Si vous avez des questions, repondez directement a cet email.',
        'via' => 'via Sellit',
        'hello' => 'Bonjour',
    ],
    'en' => [
        1 => [
            'title' => 'Did you forget something?',
            'body' => 'You started purchasing <strong>' . $productName . '</strong> but didn\'t complete your order.',
            'cta' => 'Complete my purchase',
        ],
        2 => [
            'title' => 'Your cart is waiting!',
            'body' => '<strong>' . $productName . '</strong> is still available. Don\'t miss out!',
            'cta' => $promoCode ? 'Use my promo code' : 'Resume my purchase',
        ],
        3 => [
            'title' => 'Last chance!',
            'body' => 'This is your last reminder. <strong>' . $productName . '</strong> may not be available at this price much longer.',
            'cta' => $promoCode ? 'Claim the offer' : 'Buy now',
        ],
        'price' => 'Price:',
        'your_code' => 'Your code:',
        'auto_applied' => 'The code will be applied automatically when you click the button.',
        'question' => 'If you have any questions, reply directly to this email.',
        'via' => 'via Sellit',
        'hello' => 'Hello',
    ],
];
$locale = $storeLocale === 'en' ? 'en' : 'fr';
$l = $t[$locale];
$step = $l[$reminderNumber] ?? $l[1];
@endphp
<!DOCTYPE html>
<html lang="{{ $locale }}">
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
            {{-- Urgence bandeau pour relance 3 --}}
            @if($reminderNumber === 3)
            <div style="background: #dc2626; padding: 10px; text-align: center;">
                <span style="color: white; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">
                    {{ $locale === 'en' ? 'FINAL REMINDER' : 'DERNIERE RELANCE' }}
                </span>
            </div>
            @endif

            @if($coverImage)
            <div style="text-align: center; padding: 16px 16px 0;">
                <img src="{{ $coverImage }}" alt="{{ $productName }}" style="width: 100%; max-width: 100%; height: auto; border-radius: 10px; display: block;" />
            </div>
            @endif

            <div style="padding: 24px 16px;">
                <h2 style="color: #18181b; font-size: 17px; font-weight: 700; margin: 0 0 10px; text-align: center;">
                    {{ $step['title'] }}
                </h2>

                <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0 0 20px; text-align: center;">
                    {{ $l['hello'] }}{{ $lead->customer_name ? ' ' . $lead->customer_name : '' }},<br>
                    {!! $step['body'] !!}
                </p>

                <div style="text-align: center; margin-bottom: 20px;">
                    <div style="display: inline-block; background: #fef3c7; border-radius: 10px; padding: 10px 20px;">
                        <span style="color: #92400e; font-size: 12px;">{{ $l['price'] }}</span>
                        <span style="color: #92400e; font-size: 18px; font-weight: 800; margin-left: 4px;">{{ $formattedPrice }}</span>
                    </div>
                </div>

                {{-- Code promo (relance 2 et 3 si configure) --}}
                @if($promoCode && $reminderNumber >= 2)
                <div style="background: #ecfdf5; border: 2px dashed #10b981; border-radius: 10px; padding: 16px; margin-bottom: 20px; text-align: center;">
                    @if($promoMessage)
                    <p style="color: #065f46; font-size: 14px; font-weight: 600; margin: 0 0 10px;">
                        {{ $promoMessage }}
                    </p>
                    @endif
                    <p style="color: #6b7280; font-size: 12px; margin: 0 0 6px;">{{ $l['your_code'] }}</p>
                    <div style="display: inline-block; background: white; border-radius: 8px; padding: 8px 20px; border: 1px solid #d1fae5;">
                        <span style="color: #059669; font-size: 20px; font-weight: 800; letter-spacing: 2px;">{{ $promoCode }}</span>
                    </div>
                    <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0;">{{ $l['auto_applied'] }}</p>
                </div>
                @endif

                <div style="text-align: center; margin-bottom: 14px;">
                    @php
                        $btnColor = $reminderNumber === 3 ? '#dc2626' : ($promoCode && $reminderNumber >= 2 ? '#059669' : '#18181b');
                    @endphp
                    <a href="{{ $checkoutUrl }}" style="display: inline-block; background: {{ $btnColor }}; color: white; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 10px;">
                        {{ $step['cta'] }}
                    </a>
                </div>

                <p style="color: #a1a1aa; font-size: 11px; text-align: center; margin: 0;">{{ $l['question'] }}</p>
            </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
            <p style="color: #a1a1aa; font-size: 11px; margin: 0;">{{ $storeName }} {{ $l['via'] }}</p>
        </div>
    </div>
</body>
</html>
