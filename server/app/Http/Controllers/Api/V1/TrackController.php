<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\PageEvent;
use App\Services\PostHogService;
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
            'event_type' => 'required|string|in:page_view,scroll_depth,cta_click,form_focus,form_abandon,checkout_initiate,order_created,payment_started,payment_completed,page_leave,js_error,download',
            'session_id' => 'required|string|max:64',
            'referrer' => 'nullable|string|max:2048',
            'utm_source' => 'nullable|string|max:255',
            'utm_medium' => 'nullable|string|max:255',
            'utm_campaign' => 'nullable|string|max:255',
            'metadata' => 'nullable|array',
        ]);

        // Détection device depuis User-Agent
        $ua = $request->userAgent() ?? '';
        $deviceType = 'desktop';
        if (preg_match('/Mobile|Android|iPhone|iPod/i', $ua)) {
            $deviceType = 'mobile';
        } elseif (preg_match('/Tablet|iPad/i', $ua)) {
            $deviceType = 'tablet';
        }

        // Pays depuis Cloudflare (précis, basé sur IP) ou Accept-Language en fallback
        $country = $request->header('CF-IPCountry')
            ?? $request->header('X-Vercel-IP-Country')
            ?? null;

        if (! $country || $country === 'XX') {
            $acceptLang = $request->header('Accept-Language', '');
            if (preg_match('/[a-z]{2}-([A-Z]{2})/', $acceptLang, $m)) {
                $country = $m[1];
            }
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
            'metadata' => $data['metadata'] ?? null,
        ]);

        // PostHog server-side (session_id as distinct_id for anonymous users)
        PostHogService::capture($data['session_id'], $data['event_type'], array_filter([
            'store_id' => $data['store_id'],
            'product_id' => $data['product_id'] ?? null,
            'referrer' => $data['referrer'] ?? null,
            'utm_source' => $data['utm_source'] ?? null,
            'utm_medium' => $data['utm_medium'] ?? null,
            'utm_campaign' => $data['utm_campaign'] ?? null,
            'device_type' => $deviceType,
            'country' => $country,
        ]));

        return response()->json(['tracked' => true], 202);
    }
}
