<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = ['name', 'email', 'phone', 'avatar', 'password', 'is_admin', 'sender_rating_avg', 'sender_rating_count'];

    protected $hidden = ['password', 'remember_token'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'sender_rating_avg' => 'float',
            'sender_rating_count' => 'integer',
        ];
    }

    public function driverProfile(): HasOne
    {
        return $this->hasOne(DriverProfile::class);
    }

    public function isDriver(): bool
    {
        return $this->driverProfile()->exists();
    }

    public function sentOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'sender_id');
    }

    public function drivenOrders(): HasMany
    {
        return $this->hasMany(Order::class, 'driver_id');
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class, 'driver_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }
}
