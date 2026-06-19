<?php

namespace Database\Factories;

use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DriverProfile>
 */
class DriverProfileFactory extends Factory
{
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'vehicle_type' => fake()->randomElement(['motorbike', 'car', 'truck']),
            'license_plate' => strtoupper(fake()->bothify('##?-###.##')),
            'id_card_number' => null,
            'rating_avg' => 0,
            'rating_count' => 0,
            'is_active' => true,
        ];
    }
}
