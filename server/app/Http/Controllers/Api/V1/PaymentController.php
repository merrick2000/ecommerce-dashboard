<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\Payment\PaymentOrchestrator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class PaymentController extends Controller
{
    public function __construct(
        private PaymentOrchestrator $orchestrator,
    ) {}

    /**
     * GET /api/v1/payments/countries
     */
    public function countries(): JsonResponse
    {
        return response()->json([
            'countries' => $this->orchestrator->supportedCountries(),
        ]);
    }

    /**
     * POST /api/v1/payments/initiate
     */
    public function initiate(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'country' => 'required|string|size:2',
            'network' => 'required|string|max:20',
            'phone' => 'required|string|max:30',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Données invalides.',
                'details' => $validator->errors(),
            ], 422);
        }

        $order = Order::findOrFail($request->order_id);

        if ($order->status->value !== 'pending') {
            return response()->json([
                'error' => 'Cette commande a déjà été traitée.',
                'status' => $order->status->value,
            ], 409);
        }

        $result = $this->orchestrator->initiate(
            $order,
            $request->phone,
            strtoupper($request->country),
            strtolower($request->network),
        );

        if (! $result->success) {
            return response()->json([
                'error' => $result->errorMessage ?? 'Le paiement a échoué.',
                'provider' => $result->providerName,
            ], 422);
        }

        $flow = $result->meta['flow'] ?? null;

        $messages = [
            'processing' => 'Confirmez le paiement sur votre téléphone.',
            'otp_required' => $flow === 'feexpay_pre_otp'
                ? 'Composez le code USSD sur votre téléphone puis entrez le code reçu.'
                : 'Entrez le code de confirmation reçu par SMS.',
            'redirect' => 'Redirection vers le paiement...',
        ];

        $response = [
            'status' => $result->status, // processing, otp_required, redirect
            'provider' => $result->providerName,
            'redirect_url' => $result->redirectUrl,
            'order_id' => $order->id,
            'message' => $messages[$result->status] ?? '',
        ];

        // FeexPay Orange SN : inclure les instructions USSD pour le frontend
        if ($flow === 'feexpay_pre_otp') {
            $response['otp_flow'] = 'ussd_pre_otp';
            $response['ussd_instruction'] = $result->meta['ussd_instruction'] ?? null;
        }

        return response()->json($response);
    }

    /**
     * POST /api/v1/payments/confirm-otp
     * Confirme un paiement OPR PayDunya avec le code OTP.
     */
    public function confirmOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'order_id' => 'required|exists:orders,id',
            'otp_code' => 'required|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'error' => 'Données invalides.',
                'details' => $validator->errors(),
            ], 422);
        }

        $order = Order::findOrFail($request->order_id);

        if ($order->status->value !== 'pending') {
            return response()->json([
                'error' => 'Cette commande a déjà été traitée.',
                'status' => $order->status->value,
            ], 409);
        }

        $result = $this->orchestrator->confirmOtp($order, $request->otp_code);

        if (! $result->success) {
            return response()->json([
                'error' => $result->errorMessage ?? 'Code incorrect.',
                'status' => 'failed',
            ], 422);
        }

        return response()->json([
            'status' => $order->fresh()->status->value === 'paid' ? 'paid' : 'processing',
            'order_id' => $order->id,
            'message' => 'Paiement en cours de confirmation.',
        ]);
    }

    /**
     * GET /api/v1/payments/{orderId}/status
     */
    public function status(int $orderId): JsonResponse
    {
        $order = Order::find($orderId);

        if (! $order) {
            return response()->json(['error' => 'Commande introuvable.'], 404);
        }

        if (in_array($order->status->value, ['paid', 'failed'])) {
            return response()->json([
                'status' => $order->status->value,
                'order_id' => $order->id,
            ]);
        }

        $status = $this->orchestrator->checkStatus($order);

        return response()->json([
            'status' => $status,
            'order_id' => $order->id,
        ]);
    }
}
