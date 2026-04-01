<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-text-size-adjust: 100%;">
    <div style="width: 100%; max-width: 480px; margin: 0 auto; padding: 24px 12px;">
        <div style="background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #f59e0b, #d97706); padding: 20px; text-align: center;">
                <div style="font-size: 24px; margin-bottom: 4px;">&#x1F389;</div>
                <h2 style="color: white; font-size: 16px; font-weight: 700; margin: 0;">Nouvelle vente !</h2>
                <p style="color: rgba(255,255,255,0.9); font-size: 22px; font-weight: 800; margin: 6px 0 0;">
                    {{ number_format($order->amount, 0, ',', ' ') }} {{ $order->currency }}
                </p>
            </div>

            <div style="padding: 16px;">
                <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f4f4f5;">
                    <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Produit</div>
                    <div style="color: #18181b; font-size: 14px; font-weight: 600; margin-top: 2px; word-break: break-word;">{{ $productName }}</div>
                </div>
                <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f4f4f5;">
                    <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Client</div>
                    <div style="color: #18181b; font-size: 14px; font-weight: 600; margin-top: 2px;">{{ $order->customer_name ?? '—' }}</div>
                </div>
                <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f4f4f5;">
                    <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Email</div>
                    <div style="color: #18181b; font-size: 14px; font-weight: 600; margin-top: 2px; word-break: break-all;">{{ $order->customer_email }}</div>
                </div>
                <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f4f4f5;">
                    <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Téléphone</div>
                    <div style="color: #18181b; font-size: 14px; font-weight: 600; margin-top: 2px;">{{ $order->customer_phone ?? '—' }}</div>
                </div>
                <div style="margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f4f4f5;">
                    <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Source</div>
                    <div style="color: #18181b; font-size: 14px; font-weight: 600; margin-top: 2px;">{{ $order->source ?? 'native' }}</div>
                </div>
                <div>
                    <div style="color: #71717a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px;">Commande</div>
                    <div style="color: #18181b; font-size: 14px; font-weight: 600; margin-top: 2px;">{{ $order->order_number }}</div>
                </div>
            </div>
        </div>

        <div style="text-align: center; margin-top: 20px;">
            <p style="color: #a1a1aa; font-size: 11px; margin: 0;">{{ $storeName }} — Sellit</p>
        </div>
    </div>
</body>
</html>
