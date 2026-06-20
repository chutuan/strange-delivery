<?php

namespace Database\Factories;

use App\Models\CreditTransaction;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CreditTransaction>
 */
class CreditTransactionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'driver_id' => User::factory()->driver(),
            'amount' => fake()->randomElement([5, 10, 20, 50]),
            'type' => 'topup',
            'description' => 'Nạp credit',
            'bid_id' => null,
        ];
    }
}
