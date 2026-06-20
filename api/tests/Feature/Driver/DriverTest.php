<?php

namespace Tests\Feature\Driver;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverTest extends TestCase
{
    use RefreshDatabase;

    // ── Register ──────────────────────────────────────────────────────────────

    public function test_user_can_register_as_driver(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/driver/register', [
                'vehicle_type' => 'motorbike',
                'license_plate' => '51F-123.45',
            ])->assertCreated()
              ->assertJsonStructure(['id', 'user_id', 'vehicle_type', 'license_plate']);

        $this->assertDatabaseHas('driver_profiles', ['user_id' => $user->id]);
    }

    public function test_cannot_register_driver_twice(): void
    {
        $user = User::factory()->driver()->create();

        $this->actingAs($user)
            ->postJson('/api/driver/register', [
                'vehicle_type' => 'car',
                'license_plate' => '51A-999.99',
            ])->assertUnprocessable();
    }

    public function test_register_driver_validates_vehicle_type(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/driver/register', [
                'vehicle_type' => 'bicycle',
                'license_plate' => '51F-123.45',
            ])->assertUnprocessable()
              ->assertJsonValidationErrors(['vehicle_type']);
    }

    public function test_register_driver_requires_auth(): void
    {
        $this->postJson('/api/driver/register', [
            'vehicle_type' => 'motorbike',
            'license_plate' => '51F-123.45',
        ])->assertUnauthorized();
    }

    // ── Profile ───────────────────────────────────────────────────────────────

    public function test_driver_can_get_profile(): void
    {
        $user = User::factory()->driver()->create();

        $this->actingAs($user)
            ->getJson('/api/driver/profile')
            ->assertOk()
            ->assertJsonStructure(['id', 'vehicle_type', 'license_plate', 'rating_avg', 'rating_count']);
    }

    public function test_non_driver_gets_404_on_profile(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/driver/profile')
            ->assertNotFound();
    }

    // ── Update ────────────────────────────────────────────────────────────────

    public function test_driver_can_update_profile(): void
    {
        $user = User::factory()->driver()->create();

        $this->actingAs($user)
            ->putJson('/api/driver/profile', ['license_plate' => '30A-888.88'])
            ->assertOk()
            ->assertJsonFragment(['license_plate' => '30A-888.88']);
    }

    // ── Online toggle ─────────────────────────────────────────────────────────

    public function test_driver_can_toggle_online_status(): void
    {
        $user = User::factory()->driver()->create();
        $this->assertTrue($user->driverProfile->is_active);

        $this->actingAs($user)
            ->postJson('/api/driver/toggle-online')
            ->assertOk()
            ->assertJsonFragment(['is_active' => false]);
    }

    // ── Stats ──────────────────────────────────────────────────────────────────

    public function test_driver_stats_returns_earnings_and_counts(): void
    {
        $driver = User::factory()->driver()->create();
        Order::factory()->delivered($driver)->create(['final_price' => 100000]);
        Order::factory()->delivered($driver)->create(['final_price' => 50000]);
        Order::factory()->inProgress($driver)->create();

        $this->actingAs($driver)
            ->getJson('/api/driver/stats')
            ->assertOk()
            ->assertJson([
                'total_earnings' => 150000,
                'completed_count' => 2,
                'in_progress_count' => 1,
            ]);
    }

    public function test_non_driver_cannot_get_stats(): void
    {
        $this->actingAs(User::factory()->create())
            ->getJson('/api/driver/stats')
            ->assertNotFound();
    }

    // ── Driver order history ────────────────────────────────────────────────────

    public function test_driver_can_list_own_driven_orders(): void
    {
        $driver = User::factory()->driver()->create();
        Order::factory()->delivered($driver)->create();
        Order::factory()->inProgress($driver)->create();
        Order::factory()->delivered()->create(); // tài xế khác

        $res = $this->actingAs($driver)->getJson('/api/driver/orders')->assertOk();

        $this->assertCount(2, $res->json('data'));
    }

    public function test_driver_orders_can_filter_by_status(): void
    {
        $driver = User::factory()->driver()->create();
        Order::factory()->delivered($driver)->create();
        Order::factory()->inProgress($driver)->create();

        $res = $this->actingAs($driver)->getJson('/api/driver/orders?status=delivered')->assertOk();

        $this->assertCount(1, $res->json('data'));
        $this->assertEquals('delivered', $res->json('data.0.status'));
    }
}
