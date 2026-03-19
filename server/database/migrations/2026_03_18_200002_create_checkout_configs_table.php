<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('checkout_configs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->unique()->constrained()->cascadeOnDelete();
            $table->string('template_type')->default('CLASSIC'); // CLASSIC, DARK_PREMIUM, MINIMALIST_CARD
            $table->string('primary_color', 7)->default('#E67E22');
            $table->string('cta_text')->default('Acheter maintenant');
            $table->boolean('show_urgency_timer')->default(false);
            $table->json('trust_badges')->nullable(); // ["Paiement sécurisé", "Accès immédiat", ...]
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('checkout_configs');
    }
};
