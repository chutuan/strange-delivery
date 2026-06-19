<?php

namespace Tests\Feature\Driver;

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
}
