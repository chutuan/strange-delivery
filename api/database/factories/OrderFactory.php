<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        return [
            'sender_id' => User::factory(),
            'driver_id' => null,
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
            'pickup_address' => fake()->address(),
            'pickup_lat' => null,
            'pickup_lng' => null,
            'delivery_address' => fake()->address(),
            'delivery_lat' => null,
            'delivery_lng' => null,
            'budget_price' => fake()->randomFloat(2, 30000, 500000),
            'final_price' => null,
            'note' => null,
            'status' => OrderStatus::Open,
            'delivered_at' => null,
        ];
    }

    public function draft(): static
    {
        return $this->state(['status' => OrderStatus::Draft, 'driver_id' => null, 'final_price' => null]);
    }

    public function open(): static
    {
        return $this->state(['status' => OrderStatus::Open, 'driver_id' => null, 'final_price' => null]);
    }

    public function inProgress(User $driver = null): static
    {
        return $this->state(function () use ($driver) {
            $d = $driver ?? User::factory()->driver()->create();
            return [
                'status' => OrderStatus::InProgress,
                'driver_id' => $d->id,
                'final_price' => fake()->randomFloat(2, 30000, 500000),
            ];
        });
    }

    public function delivered(User $driver = null): static
    {
        return $this->state(function () use ($driver) {
            $d = $driver ?? User::factory()->driver()->create();
            return [
                'status' => OrderStatus::Delivered,
                'driver_id' => $d->id,
                'final_price' => fake()->randomFloat(2, 30000, 500000),
                'delivered_at' => now(),
            ];
        });
    }

    public function cancelled(): static
    {
        return $this->state(['status' => OrderStatus::Cancelled]);
    }
}
