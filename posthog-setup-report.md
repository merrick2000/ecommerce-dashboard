# PostHog Setup Report

## Integration Summary

PostHog is integrated via `instrumentation-client.ts` (Next.js 15.3+ pattern) with a `/ingest` reverse proxy. Session replay and exception capture are enabled.

**Project:** [361061](https://us.posthog.com/project/361061)
**Dashboard:** [Analytics basics](https://us.posthog.com/project/361061/dashboard/1412160)

---

## Tracked Events

| Event | Description | File | Key Properties |
|-------|-------------|------|----------------|
| `product_viewed` | Fired when a user views a product checkout page | `src/components/checkout/CheckoutSwitcher.tsx` | `store_id`, `product_id`, `product_name`, `price`, `currency` |
| `checkout_form_submitted` | Fired when a user submits the checkout form | `src/components/checkout/CheckoutForm.tsx` | `store_id`, `product_id` |
| `checkout_error` | Fired when order creation fails after form submission | `src/components/checkout/CheckoutForm.tsx` | `store_id`, `product_id` |
| `payment_initiated` | Fired when mobile money payment is initiated | `src/components/payment/PaymentPage.tsx` | `store_id`, `product_id`, `country`, `network` |
| `payment_otp_submitted` | Fired when OTP code is submitted | `src/components/payment/PaymentPage.tsx` | `store_id`, `product_id` |
| `payment_failed` | Fired when a payment attempt fails | `src/components/payment/PaymentPage.tsx` | `store_id`, `product_id` |
| `purchase_completed` | Fired on success page after payment confirmed | `src/app/[slug]/success/SuccessContent.tsx` | `order_id`, `product_id`, `product_name`, `store_id`, `amount`, `currency` |
| `product_downloaded` | Fired when customer clicks download on success page | `src/app/[slug]/success/SuccessContent.tsx` | `order_id`, `product_id`, `store_id` |

---

## Dashboard Insights

All insights are pinned to the **[Analytics basics](https://us.posthog.com/project/361061/dashboard/1412160)** dashboard.

| # | Insight | URL |
|---|---------|-----|
| 1 | Main Conversion Funnel | [Cvc5KrBx](https://us.posthog.com/project/361061/insights/Cvc5KrBx) |
| 2 | Purchases vs Failed Payments | [kXEX2Zkx](https://us.posthog.com/project/361061/insights/kXEX2Zkx) |
| 3 | Payment Failure Rate | [kSwU1e0O](https://us.posthog.com/project/361061/insights/kSwU1e0O) |
| 4 | Top of Funnel: Views & Checkout Starts | [skBWWsFw](https://us.posthog.com/project/361061/insights/skBWWsFw) |
| 5 | Product Downloads | [QuiOBBay](https://us.posthog.com/project/361061/insights/QuiOBBay) |
