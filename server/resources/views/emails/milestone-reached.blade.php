<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-text-size-adjust: 100%;">
    <div style="width: 100%; max-width: 480px; margin: 0 auto; padding: 24px 12px;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #8b5cf6, #6d28d9); padding: 24px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">&#x1F389;</div>
                <h2 style="color: white; font-size: 18px; font-weight: 700; margin: 0;">
                    {{ number_format($milestone) }} visiteurs !
                </h2>
                <p style="color: rgba(255,255,255,0.8); font-size: 14px; margin: 6px 0 0;">
                    {{ $storeName }}
                </p>
            </div>

            <div style="padding: 24px 16px; text-align: center;">
                <p style="color: #52525b; font-size: 14px; line-height: 1.6; margin: 0;">
                    Votre boutique vient d'atteindre <strong>{{ number_format($milestone) }} visiteurs uniques</strong>.
                    Continuez comme ca !
                </p>
            </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
            <p style="color: #a1a1aa; font-size: 11px; margin: 0;">{{ $storeName }} — Sellit</p>
        </div>
    </div>
</body>
</html>
