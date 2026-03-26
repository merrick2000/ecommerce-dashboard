<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('base_currency', 5)->nullable()->after('currency_prices');
        });

        // Tous les produits existants ont été créés en XOF
        \Illuminate\Support\Facades\DB::table('products')
            ->whereNull('base_currency')
            ->update(['base_currency' => 'XOF']);
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn('base_currency');
        });
    }
};
