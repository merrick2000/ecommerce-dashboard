<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <div style="max-width: 520px; margin: 0 auto; padding: 40px 20px;">
        {{-- Card --}}
        <div style="background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            {{-- Banner --}}
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; text-align: center;">
                <div style="font-size: 28px; margin-bottom: 4px;">&#x1F389;</div>
                <h2 style="color: white; font-size: 18px; font-weight: 700; margin: 0;">
                    Nouvelle vente !
                </h2>
                <p style="color: rgba(255,255,255,0.9); font-size: 24px; font-weight: 800; margin: 8px 0 0;">
                    {{ number_format($order->amount, 0, ',', ' ') }} {{ $order->currency }}
                </p>
            </div>

            <div style="padding: 24px;">
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="color: #71717a; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #f4f4f5;">Produit</td>
                        <td style="color: #18181b; font-size: 13px; font-weight: 600; text-align: right; padding: 8px 0; border-bottom: 1px solid #f4f4f5;">{{ $productName }}</td>
                    </tr>
                    <tr>
                        <td style="color: #71717a; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #f4f4f5;">Client</td>
                        <td style="color: #18181b; font-size: 13px; font-weight: 600; text-align: right; padding: 8px 0; border-bottom: 1px solid #f4f4f5;">{{ $order->customer_name ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td style="color: #71717a; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #f4f4f5;">Email</td>
                        <td style="color: #18181b; font-size: 13px; font-weight: 600; text-align: right; padding: 8px 0; border-bottom: 1px solid #f4f4f5;">{{ $order->customer_email }}</td>
                    </tr>
                    <tr>
                        <td style="color: #71717a; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #f4f4f5;">Téléphone</td>
                        <td style="color: #18181b; font-size: 13px; font-weight: 600; text-align: right; padding: 8px 0; border-bottom: 1px solid #f4f4f5;">{{ $order->customer_phone ?? '—' }}</td>
                    </tr>
                    <tr>
                        <td style="color: #71717a; font-size: 13px; padding: 8px 0; border-bottom: 1px solid #f4f4f5;">Source</td>
                        <td style="color: #18181b; font-size: 13px; font-weight: 600; text-align: right; padding: 8px 0; border-bottom: 1px solid #f4f4f5;">{{ $order->source ?? 'native' }}</td>
                    </tr>
                    <tr>
                        <td style="color: #71717a; font-size: 13px; padding: 8px 0;">Commande</td>
                        <td style="color: #18181b; font-size: 13px; font-weight: 600; text-align: right; padding: 8px 0;">{{ $order->order_number }}</td>
                    </tr>
                </table>
            </div>
        </div>

        {{-- Footer --}}
        <div style="text-align: center; margin-top: 24px;">
            <p style="color: #a1a1aa; font-size: 12px; margin: 0;">
                {{ $storeName }} — Sellit
            </p>
        </div>
    </div>
</body>
</html>
