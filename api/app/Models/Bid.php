<?php

namespace App\Models;

use App\Enums\BidStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Bid extends Model
{
    use HasFactory;

    protected $attributes = ['status' => BidStatus::Pending->value];

    protected $fillable = ['order_id', 'driver_id', 'price', 'note', 'status'];

    protected function casts(): array
    {
        return [
            'price' => 'float',
            'status' => BidStatus::class,
        ];
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function driver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'driver_id');
    }
}
