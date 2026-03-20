<?php

namespace App\Services\Payment;

use App\Models\Order;

interface PaymentProviderInterface
{
    /**
     * Identifiant unique du provider (fedapay, paydunya, feexpay, pawapay).
     */
    public function name(): string;

    /**
     * Vérifie si ce provider supporte le pays + réseau donné.
     */
    public function supports(string $country, string $network): bool;

    /**
     * Initie un paiement pour la commande donnée.
     */
    public function initiate(Order $order, string $phone, string $country, string $network): PaymentResult;

    /**
     * Vérifie le statut d'une transaction auprès du provider.
     */
    public function checkStatus(string $providerRef): string; // pending, paid, failed

    /**
     * Valide et parse un webhook entrant. Retourne [ref, status] ou null si invalide.
     *
     * @return array{ref: string, status: string}|null
     */
    public function parseWebhook(array $payload, array $headers): ?array;
}
