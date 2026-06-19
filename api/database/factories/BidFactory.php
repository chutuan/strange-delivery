<?php

namespace Database\Factories;

use App\Models\Bid;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Bid>
 */
class BidFactory extends Factory
{
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'driver_id' => User::factory()->driver(),
            'price' => fake()->randomFloat(2, 30000, 500000),
            'note' => fake()->optional()->sentence(),
            'status' => 'pending',
        ];
    }

    public function accepted(): static
    {
        return $this->state(['status' => 'accepted']);
    }

    public function rejected(): static
    {
        return $this->state(['status' => 'rejected']);
    }
}
