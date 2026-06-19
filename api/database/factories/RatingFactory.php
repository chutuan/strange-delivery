<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Rating>
 */
class RatingFactory extends Factory
{
    public function definition(): array
    {
        $order = Order::factory()->delivered()->create();
        return [
            'order_id' => $order->id,
            'sender_id' => $order->sender_id,
            'driver_id' => $order->driver_id,
            'score' => fake()->numberBetween(1, 5),
            'comment' => fake()->optional()->sentence(),
        ];
    }
}
