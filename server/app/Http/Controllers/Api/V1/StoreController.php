<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\JsonResponse;

class StoreController extends Controller
{
    /**
     * GET /api/v1/stores
     *
     * Liste toutes les boutiques publiques.
     */
    public function index(): JsonResponse
    {
        $stores = Store::select('id', 'name', 'slug', 'currency')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($stores);
    }
}
