<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DriverProfile extends Model
{
    protected $fillable = [
        'user_id', 'id_card_number', 'is_active', 'rating_avg', 'rating_count',
        'current_lat', 'current_lng', 'notification_radius_km', 'push_token',
        'credits',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'current_lat' => 'float',
            'current_lng' => 'float',
            'notification_radius_km' => 'integer',
            'credits' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function vehicles(): HasMany
    {
        return $this->hasMany(Vehicle::class)->orderByDesc('is_primary');
    }

    public function primaryVehicle(): HasOne
    {
        return $this->hasOne(Vehicle::class)->where('is_primary', true);
    }
}
