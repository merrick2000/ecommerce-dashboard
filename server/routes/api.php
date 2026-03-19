<?php

use App\Http\Controllers\Api\V1\CheckoutController;
use App\Http\Controllers\Api\V1\DownloadController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\StoreController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// ─── API V1 (Public — consommée par le storefront Next.js) ──────────
Route::prefix('v1')->group(function () {
    // Boutiques
    Route::get('/stores', [StoreController::class, 'index']);
    Route::get('/stores/{slug}', [StoreController::class, 'show']);

    // Checkout : récupère la config de la boutique + un produit spécifique
    Route::get('/checkout/{storeSlug}/{productId}', [CheckoutController::class, 'show']);

    // Commandes
    Route::post('/orders/create', [OrderController::class, 'create']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    // Téléchargement sécurisé (URL temporaire S3)
    Route::get('/download/{orderId}', DownloadController::class);
    Route::post('/download/{orderId}/track', [DownloadController::class, 'track']);
});
