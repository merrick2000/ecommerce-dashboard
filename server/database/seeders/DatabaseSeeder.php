<?php

namespace Database\Seeders;

use App\Enums\TemplateType;
use App\Models\CheckoutConfig;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        $admin = User::create([
            'name' => 'Admin',
            'email' => 'admin@admin.com',
            'password' => Hash::make('password'),
        ]);

        // Demo store
        $store = Store::create([
            'user_id' => $admin->id,
            'name' => 'Formation Dev Africa',
            'slug' => 'formation-dev-africa',
            'currency' => 'XOF',
        ]);

        // Demo product
        Product::create([
            'store_id' => $store->id,
            'name' => 'Formation React & Next.js - De Zéro à Expert',
            'description' => "Apprenez React et Next.js de A à Z avec des projets concrets.\n\n✅ +40 heures de vidéo HD\n✅ Code source complet\n✅ Accès à vie\n✅ Certificat de complétion",
            'price' => 15000,
        ]);

        // Demo checkout config
        CheckoutConfig::create([
            'store_id' => $store->id,
            'template_type' => TemplateType::CLASSIC->value,
            'primary_color' => '#E67E22',
            'cta_text' => 'Débloquer mon accès',
            'show_urgency_timer' => true,
            'trust_badges' => ['Paiement sécurisé', 'Accès immédiat', 'Satisfait ou remboursé'],
        ]);
    }
}
