<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PageEvent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TrackController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'store_id' => 'required|integer|exists:stores,id',
            'product_id' => 'nullable|integer',
            'event_type' => 'required|string|in:page_view,checkout_initiate,order_created,payment_started,payment_completed,download',
            'session_id' => 'required|string|max:64',
            'referrer' => 'nullable|string|max:2048',
            'utm_source' => 'nullable|string|max:255',
            'utm_medium' => 'nullable|string|max:255',
            'utm_campaign' => 'nullable|string|max:255',
        ]);

        // Détection device depuis User-Agent
        $ua = $request->userAgent() ?? '';
        $deviceType = 'desktop';
        if (preg_match('/Mobile|Android|iPhone|iPod/i', $ua)) {
            $deviceType = 'mobile';
        } elseif (preg_match('/Tablet|iPad/i', $ua)) {
            $deviceType = 'tablet';
        }

        // Pays depuis Accept-Language (heuristique)
        $country = null;
        $acceptLang = $request->header('Accept-Language', '');
        if (preg_match('/[a-z]{2}-([A-Z]{2})/', $acceptLang, $m)) {
            $country = $m[1];
        }

        PageEvent::create([
            'store_id' => $data['store_id'],
            'product_id' => $data['product_id'] ?? null,
            'event_type' => $data['event_type'],
            'session_id' => $data['session_id'],
            'ip_hash' => hash('sha256', $request->ip()),
            'referrer' => $data['referrer'] ?? null,
            'utm_source' => $data['utm_source'] ?? null,
            'utm_medium' => $data['utm_medium'] ?? null,
            'utm_campaign' => $data['utm_campaign'] ?? null,
            'device_type' => $deviceType,
            'country' => $country,
            'user_agent' => Str::limit($ua, 512),
        ]);

        return response()->json(['tracked' => true], 202);
    }
}
