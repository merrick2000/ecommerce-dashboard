<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->string('customer_email');
            $table->string('customer_name')->nullable();
            $table->unsignedInteger('amount'); // Prix en integer (XOF)
            $table->string('currency', 10)->default('XOF');
            $table->string('status')->default('pending'); // pending, paid, failed
            $table->string('payment_method')->nullable(); // fedapay, paydunya
            $table->string('payment_ref')->nullable(); // Référence de paiement externe
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
