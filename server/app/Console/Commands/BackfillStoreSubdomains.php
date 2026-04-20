<?php

namespace App\Console\Commands;

use App\Models\Store;
use Illuminate\Console\Command;

class BackfillStoreSubdomains extends Command
{
    protected $signature = 'stores:backfill-subdomains';

    protected $description = 'Backfill missing subdomains by using the store slug';

    public function handle(): int
    {
        $stores = Store::whereNull('subdomain')->orWhere('subdomain', '')->get();

        foreach ($stores as $store) {
            $store->subdomain = $store->slug;
            $store->save();
            $this->info("Updated {$store->name}: subdomain = {$store->slug}");
        }

        $this->info("Done. {$stores->count()} stores updated.");

        return self::SUCCESS;
    }
}
