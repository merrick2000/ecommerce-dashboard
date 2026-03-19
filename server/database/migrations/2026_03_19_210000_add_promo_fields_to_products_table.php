<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->string('promo_type')->default('none')->after('price'); // none, percentage, fixed
            $table->unsignedInteger('promo_value')->nullable()->after('promo_type'); // % or fixed amount
            $table->string('promo_label')->nullable()->after('promo_value'); // custom marketing text
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['promo_type', 'promo_value', 'promo_label']);
        });
    }
};
