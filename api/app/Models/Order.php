<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Str;

class Order extends Model
{
    use HasFactory;

    protected $attributes = ['status' => OrderStatus::Draft->value];

    public function getRouteKeyName(): string
    {
        return 'order_code';
    }

    protected static function booted(): void
    {
        static::creating(function (Order $order) {
            if (! empty($order->order_code)) {
                return;
            }
            do {
                $code = 'SD' . strtoupper(Str::random(8));
            } while (self::where('order_code', $code)->exists());
            $order->order_code = $code;
        });
    }

    protected $hidden = ['recipient_name', 'recipient_phone'];

    protected $fillable = [
        'sender_id', 'driver_id', 'title', 'description',
        'pickup_address', 'pickup_lat', 'pickup_lng',
        'delivery_address', 'delivery_lat', 'delivery_lng',
        'recipient_name', 'recipient_phone',
        'budget_price', 'final_price', 'note', 'delivery_note', 'proof_photo', 'status', 'order_type', 'vehicle_type',
        'pickup_time', 'required_before', 'delivered_at', 'accepted_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'pickup_lat' => 'float',
            'pickup_lng' => 'float',
            'delivery_lat' => 'float',
            'delivery_lng' => 'float',
            'budget_price' => 'float',
            'final_price' => 'float',
            'pickup_time' => 'datetime',
            'required_before' => 'datetime',
            'delivered_at' => 'datetime',
            'accepted_at' => 'datetime',
        ];
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }

    public function rating(): HasOne
    {
        return $this->hasOne(Rating::class);
    }
}
