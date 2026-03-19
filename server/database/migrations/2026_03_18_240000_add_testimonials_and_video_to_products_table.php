<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('testimonials')->nullable()->after('faqs');
            $table->string('testimonials_style')->default('cards')->after('testimonials');
            $table->string('video_url')->nullable()->after('testimonials_style');
            $table->string('video_title')->nullable()->after('video_url');
            $table->string('video_position')->default('below_description')->after('video_title');
            $table->longText('description')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['testimonials', 'testimonials_style', 'video_url', 'video_title', 'video_position']);
        });
    }
};
