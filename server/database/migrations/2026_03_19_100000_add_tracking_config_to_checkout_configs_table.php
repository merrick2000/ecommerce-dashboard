<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('checkout_configs', function (Blueprint $table) {
            $table->json('tracking_config')->nullable()->after('sales_popup');
        });
    }

    public function down(): void
    {
        Schema::table('checkout_configs', function (Blueprint $table) {
            $table->dropColumn('tracking_config');
        });
    }
};
