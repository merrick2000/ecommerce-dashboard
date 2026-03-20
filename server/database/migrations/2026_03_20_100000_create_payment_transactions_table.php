<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('provider'); // feexpay, fedapay, paydunya, pawapay
            $table->string('provider_ref')->nullable()->index(); // Ref côté provider
            $table->string('country', 2); // BJ, SN, CI, TG, BF, CG
            $table->string('network'); // mtn, moov, wave, orange, free
            $table->string('phone'); // Numéro complet (avec indicatif)
            $table->string('status')->default('pending'); // pending, processing, paid, failed
            $table->integer('amount');
            $table->string('currency', 10)->default('XOF');
            $table->json('provider_response')->nullable(); // Réponse brute du provider
            $table->json('webhook_payload')->nullable(); // Payload brut du webhook
            $table->string('error_message')->nullable();
            $table->integer('attempt_number')->default(1); // Numéro de tentative (fallback)
            $table->timestamps();

            $table->index(['order_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_transactions');
    }
};
