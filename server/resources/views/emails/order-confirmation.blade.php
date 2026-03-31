<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
        {{-- Header --}}
        <div style="text-align: center; margin-bottom: 32px;">
            <h1 style="font-size: 20px; font-weight: 700; color: #18181b; margin: 0;">
                {{ $storeName }}
            </h1>
        </div>

        {{-- Card --}}
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            {{-- Green banner --}}
            <div style="background: #10b981; padding: 24px; text-align: center;">
                <div style="font-size: 32px; margin-bottom: 8px;">&#10003;</div>
                <h2 style="color: white; font-size: 18px; font-weight: 700; margin: 0;">
                    Paiement confirmé !
                </h2>
            </div>

            <div style="padding: 32px 24px;">
                <p style="color: #52525b; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
                    Bonjour <strong>{{ $order->customer_name ?? 'Client' }}</strong>,<br>
                    Merci pour votre achat ! Votre commande a bien été confirmée.
                </p>

                {{-- Order details --}}
                <div style="background: #fafafa; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="color: #71717a; font-size: 13px; padding: 6px 0;">Produit</td>
                            <td style="color: #18181b; font-size: 13px; font-weight: 600; text-align: right; padding: 6px 0;">{{ $productName }}</td>
                        </tr>
                        <tr>
                            <td style="color: #71717a; font-size: 13px; padding: 6px 0;">Montant</td>
                            <td style="color: #18181b; font-size: 13px; font-weight: 600; text-align: right; padding: 6px 0;">{{ number_format($order->amount, 0, ',', ' ') }} {{ $order->currency }}</td>
                        </tr>
                        <tr>
                            <td style="color: #71717a; font-size: 13px; padding: 6px 0;">Commande</td>
                            <td style="color: #18181b; font-size: 13px; font-weight: 600; text-align: right; padding: 6px 0;">{{ $order->order_number }}</td>
                        </tr>
                    </table>
                </div>

                {{-- Download button --}}
                @if($downloadUrl)
                <div style="text-align: center; margin-bottom: 24px;">
                    <a href="{{ $downloadUrl }}" style="display: inline-block; background: #18181b; color: white; font-size: 15px; font-weight: 700; text-decoration: none; padding: 14px 32px; border-radius: 12px;">
                        Accéder à mon produit
                    </a>
                </div>
                <p style="color: #a1a1aa; font-size: 12px; text-align: center; margin: 0;">
                    Ce lien est personnel, ne le partagez pas.
                </p>
                @endif
            </div>
        </div>

        {{-- Footer --}}
        <div style="text-align: center; margin-top: 32px;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                Envoyé par {{ $storeName }} via Sellit
            </p>
        </div>
    </div>
</body>
</html>
