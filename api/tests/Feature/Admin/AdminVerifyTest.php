<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminVerifyTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_verify_a_driver(): void
    {
        $admin = User::factory()->admin()->create();
        $driver = User::factory()->driver()->create();
        $this->assertFalse($driver->driverProfile->is_verified);

        $this->actingAs($admin)
            ->postJson("/api/admin/drivers/{$driver->id}/verify")
            ->assertOk()
            ->assertJsonPath('is_verified', true);

        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $driver->id,
            'is_verified' => true,
        ]);
    }

    public function test_verify_toggles_off(): void
    {
        $admin = User::factory()->admin()->create();
        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update(['is_verified' => true]);

        $this->actingAs($admin)
            ->postJson("/api/admin/drivers/{$driver->id}/verify")
            ->assertOk()
            ->assertJsonPath('is_verified', false);
    }

    public function test_verify_non_driver_returns_422(): void
    {
        $admin = User::factory()->admin()->create();
        $notDriver = User::factory()->create();

        $this->actingAs($admin)
            ->postJson("/api/admin/drivers/{$notDriver->id}/verify")
            ->assertUnprocessable();
    }

    public function test_non_admin_cannot_verify(): void
    {
        $driver = User::factory()->driver()->create();

        $this->actingAs(User::factory()->create())
            ->postJson("/api/admin/drivers/{$driver->id}/verify")
            ->assertForbidden();
    }

    public function test_verified_flag_appears_in_public_profile(): void
    {
        $admin = User::factory()->admin()->create();
        $driver = User::factory()->driver()->create();

        $this->actingAs($admin)
            ->postJson("/api/admin/drivers/{$driver->id}/verify")
            ->assertOk();

        $this->actingAs(User::factory()->create())
            ->getJson("/api/drivers/{$driver->id}/profile")
            ->assertOk()
            ->assertJsonPath('is_verified', true);
    }
}
