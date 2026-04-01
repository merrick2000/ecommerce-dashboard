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
        Schema::table('leads', function (Blueprint $table) {
            $table->unsignedSmallInteger('reminder_count')->default(0)->after('reminded_at');
            $table->timestamp('converted_at')->nullable()->after('reminder_count');
            $table->timestamp('last_reminded_at')->nullable()->after('converted_at');
        });
    }

    public function down(): void
    {
        Schema::table('leads', function (Blueprint $table) {
            $table->dropColumn(['reminder_count', 'converted_at', 'last_reminded_at']);
        });
    }
};
