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
            ->assertJsonStructure(['id', 'user_id', 'vehicles'])
            ->assertJsonPath('vehicles.0.vehicle_type', 'motorbike')
            ->assertJsonPath('vehicles.0.license_plate', '51F-123.45')
            ->assertJsonPath('vehicles.0.is_primary', true);

        $this->assertDatabaseHas('driver_profiles', ['user_id' => $user->id]);
        $this->assertDatabaseHas('vehicles', ['license_plate' => '51F-123.45']);
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
            ->assertJsonStructure(['id', 'rating_avg', 'rating_count', 'vehicles']);
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
            ->putJson('/api/driver/profile', [])
            ->assertOk()
            ->assertJsonStructure(['id', 'rating_avg', 'vehicles']);
    }

    // ── Vehicles ──────────────────────────────────────────────────────────────

    public function test_driver_can_list_vehicles(): void
    {
        $user = User::factory()->driver()->create();

        $this->actingAs($user)
            ->getJson('/api/driver/vehicles')
            ->assertOk()
            ->assertJsonStructure([['id', 'vehicle_type', 'license_plate', 'is_primary']]);
    }

    public function test_driver_can_add_vehicle(): void
    {
        $user = User::factory()->driver()->create();

        $this->actingAs($user)
            ->postJson('/api/driver/vehicles', [
                'vehicle_type' => 'car',
                'license_plate' => '30A-888.88',
            ])->assertCreated()
            ->assertJsonFragment(['license_plate' => '30A-888.88', 'vehicle_type' => 'car']);

        $this->assertDatabaseHas('vehicles', ['license_plate' => '30A-888.88']);
    }

    public function test_driver_can_update_vehicle(): void
    {
        $user = User::factory()->driver()->create();
        $vehicle = $user->driverProfile->vehicles()->first();

        $this->actingAs($user)
            ->putJson("/api/driver/vehicles/{$vehicle->id}", ['license_plate' => '99Z-000.01'])
            ->assertOk()
            ->assertJsonFragment(['license_plate' => '99Z-000.01']);
    }

    public function test_driver_cannot_delete_last_vehicle(): void
    {
        $user = User::factory()->driver()->create();
        $vehicle = $user->driverProfile->vehicles()->first();

        $this->actingAs($user)
            ->deleteJson("/api/driver/vehicles/{$vehicle->id}")
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Phải có ít nhất 1 phương tiện.']);
    }

    public function test_driver_can_delete_non_last_vehicle(): void
    {
        $user = User::factory()->driver()->create();
        $profile = $user->driverProfile;
        $extra = $profile->vehicles()->create(['vehicle_type' => 'car', 'license_plate' => '51A-111.11', 'is_primary' => false]);

        $this->actingAs($user)
            ->deleteJson("/api/driver/vehicles/{$extra->id}")
            ->assertOk();

        $this->assertDatabaseMissing('vehicles', ['id' => $extra->id]);
    }

    public function test_driver_can_set_primary_vehicle(): void
    {
        $user = User::factory()->driver()->create();
        $profile = $user->driverProfile;
        $extra = $profile->vehicles()->create(['vehicle_type' => 'car', 'license_plate' => '51A-111.11', 'is_primary' => false]);

        $this->actingAs($user)
            ->postJson("/api/driver/vehicles/{$extra->id}/primary")
            ->assertOk()
            ->assertJsonFragment(['is_primary' => true]);

        $this->assertDatabaseHas('vehicles', ['id' => $extra->id, 'is_primary' => true]);
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
                'total_delivered' => 2,
                'active_orders' => 1,
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
