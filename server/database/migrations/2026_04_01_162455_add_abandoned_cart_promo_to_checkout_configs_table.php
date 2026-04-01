<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('checkout_configs', function (Blueprint $table) {
            $table->json('abandoned_cart_promo')->nullable()->after('page_layout');
        });
    }

    public function down(): void
    {
        Schema::table('checkout_configs', function (Blueprint $table) {
            $table->dropColumn('abandoned_cart_promo');
        });
    }
};
