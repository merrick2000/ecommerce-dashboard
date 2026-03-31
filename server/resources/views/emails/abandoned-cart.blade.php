@php
$t = [
    'fr' => [
        'forgot' => 'Vous avez oublié quelque chose ?',
        'hello' => 'Bonjour',
        'started' => 'Vous avez commencé l\'achat de',
        'not_finished' => 'mais vous n\'avez pas terminé.',
        'price' => 'Prix :',
        'cta' => 'Terminer mon achat',
        'question' => 'Si vous avez des questions, répondez directement à cet email.',
        'via' => 'via Sellit',
    ],
    'en' => [
        'forgot' => 'Did you forget something?',
        'hello' => 'Hello',
        'started' => 'You started purchasing',
        'not_finished' => 'but didn\'t complete your order.',
        'price' => 'Price:',
        'cta' => 'Complete my purchase',
        'question' => 'If you have any questions, reply directly to this email.',
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
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #18181b; margin: 0;">{{ $storeName }}</h1>
        </div>

        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            @if($coverImage)
            <div style="text-align: center; padding: 24px 24px 0;">
                <img src="{{ $coverImage }}" alt="{{ $productName }}" style="max-width: 100%; height: auto; border-radius: 12px;" />
            </div>
            @endif

            <div style="padding: 32px 24px;">
                <h2 style="color: #18181b; font-size: 18px; font-weight: 700; margin: 0 0 12px; text-align: center;">
                    {{ $l['forgot'] }}
                </h2>

                <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 24px; text-align: center;">
                    {{ $l['hello'] }}{{ $lead->customer_name ? ' ' . $lead->customer_name : '' }},<br>
                    {{ $l['started'] }} <strong>{{ $productName }}</strong> {{ $l['not_finished'] }}
                </p>

                <div style="text-align: center; margin-bottom: 24px;">
                    <div style="display: inline-block; background: #fef3c7; border-radius: 12px; padding: 12px 24px;">
                        <span style="color: #92400e; font-size: 13px;">{{ $l['price'] }}</span>
                        <span style="color: #92400e; font-size: 20px; font-weight: 800; margin-left: 4px;">{{ $formattedPrice }}</span>
                    </div>
                </div>

                <div style="text-align: center; margin-bottom: 16px;">
                    <a href="{{ $checkoutUrl }}" style="display: inline-block; background: #18181b; color: white; font-size: 16px; font-weight: 700; text-decoration: none; padding: 16px 40px; border-radius: 12px;">
                        {{ $l['cta'] }}
                    </a>
                </div>

                <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">{{ $l['question'] }}</p>
            </div>
        </div>

        <div style="text-align: center; margin-top: 32px;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">{{ $storeName }} {{ $l['via'] }}</p>
        </div>
    </div>
</body>
</html>
