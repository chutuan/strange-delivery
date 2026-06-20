<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = ['user_id', 'order_id', 'type', 'title', 'body', 'read_at'];

    protected function casts(): array
    {
        return ['read_at' => 'datetime'];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public static function notify(int $userId, string $type, string $title, ?string $body = null, ?int $orderId = null): self
    {
        return static::create([
            'user_id' => $userId,
            'order_id' => $orderId,
            'type' => $type,
            'title' => $title,
            'body' => $body,
        ]);
    }
}
