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
        // Raw SQL car Schema::change() ne gere pas bien le cast sur PostgreSQL
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE products ALTER COLUMN price TYPE decimal(12,2) USING price::decimal');
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE products ALTER COLUMN promo_value TYPE decimal(12,2) USING promo_value::decimal');
    }

    public function down(): void
    {
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE products ALTER COLUMN price TYPE integer USING price::integer');
        \Illuminate\Support\Facades\DB::statement('ALTER TABLE products ALTER COLUMN promo_value TYPE integer USING promo_value::integer');
    }
};
