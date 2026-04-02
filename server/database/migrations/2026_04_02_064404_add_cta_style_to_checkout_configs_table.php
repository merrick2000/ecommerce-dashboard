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
            $table->string('cta_style', 20)->default('default')->after('cta_text');
        });
    }

    public function down(): void
    {
        Schema::table('checkout_configs', function (Blueprint $table) {
            $table->dropColumn('cta_style');
        });
    }
};
