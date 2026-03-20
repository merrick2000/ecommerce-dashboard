<?php

namespace App\Models;

use Filament\Models\Contracts\FilamentUser;
use Filament\Models\Contracts\HasTenants;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Collection;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements FilamentUser, HasTenants
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'first_name',
        'email',
        'phone',
        'country',
        'product_type',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return true;
    }

    public function stores(): HasMany
    {
        return $this->hasMany(Store::class);
    }

    public function getTenants(Panel $panel): Collection
    {
        return $this->stores;
    }

    public function canAccessTenant(Model $tenant): bool
    {
        return $this->stores()->whereKey($tenant->getKey())->exists();
    }
}
