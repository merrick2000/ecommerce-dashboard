<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class LeadController extends Controller
{
    /**
     * POST /api/v1/leads/capture
     *
     * Capture un lead dès que l'utilisateur saisit son email.
     * Utilisé pour la relance panier abandonné.
     */
    public function capture(Request $request): JsonResponse
    {
        $data = $request->validate([
            'store_id' => 'required|integer|exists:stores,id',
            'product_id' => 'required|integer|exists:products,id',
            'email' => 'required|email|max:255',
            'name' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:50',
        ]);

        Lead::updateOrCreate(
            [
                'store_id' => $data['store_id'],
                'product_id' => $data['product_id'],
                'customer_email' => $data['email'],
            ],
            [
                'customer_name' => $data['name'] ?? null,
                'customer_phone' => $data['phone'] ?? null,
                'source' => 'checkout',
            ]
        );

        return response()->json(['captured' => true], 202);
    }
}
