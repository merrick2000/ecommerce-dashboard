<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Payment\PaymentOrchestrator;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class WebhookController extends Controller
{
    public function __construct(
        private PaymentOrchestrator $orchestrator,
    ) {}

    /**
     * POST /api/v1/webhooks/feexpay
     */
    public function feexpay(Request $request): Response
    {
        $this->orchestrator->handleWebhook(
            'feexpay',
            $request->all(),
            $request->headers->all(),
        );

        return response('OK', 200);
    }

    /**
     * POST /api/v1/webhooks/fedapay
     */
    public function fedapay(Request $request): Response
    {
        $this->orchestrator->handleWebhook(
            'fedapay',
            $request->all(),
            $request->headers->all(),
        );

        return response('OK', 200);
    }

    /**
     * POST /api/v1/webhooks/paydunya
     *
     * PayDunya IPN attend la réponse CBTOKEN:MPSTATOK
     */
    public function paydunya(Request $request): Response
    {
        $this->orchestrator->handleWebhook(
            'paydunya',
            $request->all(),
            $request->headers->all(),
        );

        // Réponse spéciale requise par PayDunya
        $confirmation = $this->orchestrator->getPayDunyaConfirmationResponse();

        return response($confirmation, 200);
    }

    /**
     * POST /api/v1/webhooks/chariow
     */
    public function chariow(Request $request): Response
    {
        // Vérifier la signature HMAC si configurée
        $provider = $this->orchestrator->getProvider('chariow');

        if ($provider instanceof \App\Services\Payment\Providers\ChariowProvider) {
            $signature = $request->header('X-Chariow-Signature', '');
            $rawPayload = $request->getContent();

            if (! $provider->verifyWebhookSignature($rawPayload, $signature)) {
                \App\Services\Payment\PaymentLogger::error('chariow', 'Invalid webhook signature');

                return response('Invalid signature', 401);
            }
        }

        $this->orchestrator->handleWebhook(
            'chariow',
            $request->all(),
            $request->headers->all(),
        );

        return response('OK', 200);
    }

    /**
     * POST /api/v1/webhooks/pawapay
     */
    public function pawapay(Request $request): Response
    {
        $this->orchestrator->handleWebhook(
            'pawapay',
            $request->all(),
            $request->headers->all(),
        );

        return response('OK', 200);
    }
}
