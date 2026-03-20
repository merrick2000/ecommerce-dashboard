<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_settings', function (Blueprint $table) {
            $table->id();
            $table->string('mode')->default('sandbox'); // sandbox | live
            $table->json('providers')->nullable(); // Config par provider
            $table->timestamps();
        });

        // Insérer la ligne unique
        \DB::table('payment_settings')->insert([
            'mode' => 'sandbox',
            'providers' => json_encode([
                'feexpay' => ['enabled' => false, 'sandbox' => [], 'live' => []],
                'fedapay' => ['enabled' => false, 'sandbox' => [], 'live' => []],
                'paydunya' => ['enabled' => false, 'sandbox' => [], 'live' => []],
                'pawapay' => ['enabled' => false, 'sandbox' => [], 'live' => []],
            ]),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_settings');
    }
};
