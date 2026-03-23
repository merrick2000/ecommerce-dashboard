<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('external_platform', 20)->nullable()->after('payment_link');
            $table->string('external_product_id')->nullable()->unique()->after('external_platform');
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['external_platform', 'external_product_id']);
        });
    }
};
