<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class DriverProfile extends Model
{
    protected $fillable = [
        'user_id', 'vehicle_type', 'license_plate', 'id_card_number',
        'is_active', 'rating_avg', 'rating_count',
        'current_lat', 'current_lng', 'notification_radius_km', 'push_token',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'current_lat' => 'float',
            'current_lng' => 'float',
            'notification_radius_km' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
