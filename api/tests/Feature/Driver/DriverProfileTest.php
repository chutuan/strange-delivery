<?php

namespace Tests\Feature\Driver;

use App\Models\Order;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_driver_profile_returns_trust_data(): void
    {
        $driver = User::factory()->driver()->create();
        Order::factory()->delivered($driver)->create();
        Order::factory()->delivered($driver)->create();

        $this->actingAs(User::factory()->create())
            ->getJson("/api/drivers/{$driver->id}/profile")
            ->assertOk()
            ->assertJsonStructure([
                'id', 'name', 'member_since', 'is_active', 'is_verified',
                'rating_avg', 'rating_count', 'total_delivered', 'vehicle_types', 'reviews',
            ])
            ->assertJsonPath('id', $driver->id)
            ->assertJsonPath('total_delivered', 2)
            ->assertJsonPath('is_verified', false);
    }

    public function test_profile_returns_404_for_non_driver(): void
    {
        $notDriver = User::factory()->create();

        $this->actingAs(User::factory()->create())
            ->getJson("/api/drivers/{$notDriver->id}/profile")
            ->assertNotFound();
    }

    public function test_profile_requires_auth(): void
    {
        $driver = User::factory()->driver()->create();

        $this->getJson("/api/drivers/{$driver->id}/profile")->assertUnauthorized();
    }

    public function test_profile_includes_reviews(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();
        $order = Order::factory()->delivered($driver)->create(['sender_id' => $sender->id]);

        Rating::create([
            'order_id' => $order->id,
            'sender_id' => $sender->id,
            'driver_id' => $driver->id,
            'score' => 5,
            'comment' => 'Tài xế tốt',
        ]);

        $this->actingAs(User::factory()->create())
            ->getJson("/api/drivers/{$driver->id}/profile")
            ->assertOk()
            ->assertJsonPath('reviews.0.score', 5)
            ->assertJsonPath('reviews.0.comment', 'Tài xế tốt');
    }
}
