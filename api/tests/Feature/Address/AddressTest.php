<?php

namespace Tests\Feature\Address;

use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddressTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_an_address(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/addresses', [
                'label' => 'Nhà',
                'address' => '12 Nguyễn Trãi',
                'recipient_name' => 'An',
                'recipient_phone' => '0901234567',
                'is_default' => true,
            ])->assertCreated()
            ->assertJsonFragment(['label' => 'Nhà', 'is_default' => true]);

        $this->assertDatabaseHas('addresses', ['user_id' => $user->id, 'label' => 'Nhà']);
    }

    public function test_create_validates_required_fields(): void
    {
        $this->actingAs(User::factory()->create())
            ->postJson('/api/addresses', ['label' => ''])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['label', 'address']);
    }

    public function test_index_lists_only_own_addresses_default_first(): void
    {
        $user = User::factory()->create();
        Address::create(['user_id' => $user->id, 'label' => 'A', 'address' => 'x', 'is_default' => false]);
        Address::create(['user_id' => $user->id, 'label' => 'Default', 'address' => 'y', 'is_default' => true]);
        Address::create(['user_id' => User::factory()->create()->id, 'label' => 'Other', 'address' => 'z']);

        $res = $this->actingAs($user)->getJson('/api/addresses')->assertOk();

        $this->assertCount(2, $res->json());
        $this->assertEquals('Default', $res->json('0.label'));
    }

    public function test_creating_default_unsets_previous_default(): void
    {
        $user = User::factory()->create();
        $first = Address::create(['user_id' => $user->id, 'label' => 'A', 'address' => 'x', 'is_default' => true]);

        $this->actingAs($user)
            ->postJson('/api/addresses', ['label' => 'B', 'address' => 'y', 'is_default' => true])
            ->assertCreated();

        $this->assertDatabaseHas('addresses', ['id' => $first->id, 'is_default' => false]);
    }

    public function test_user_can_update_own_address(): void
    {
        $user = User::factory()->create();
        $a = Address::create(['user_id' => $user->id, 'label' => 'A', 'address' => 'x']);

        $this->actingAs($user)
            ->putJson("/api/addresses/{$a->id}", ['label' => 'B', 'address' => 'z'])
            ->assertOk()
            ->assertJsonFragment(['label' => 'B', 'address' => 'z']);
    }

    public function test_user_cannot_update_others_address(): void
    {
        $a = Address::create(['user_id' => User::factory()->create()->id, 'label' => 'A', 'address' => 'x']);

        $this->actingAs(User::factory()->create())
            ->putJson("/api/addresses/{$a->id}", ['label' => 'B', 'address' => 'z'])
            ->assertForbidden();
    }

    public function test_user_can_delete_own_address(): void
    {
        $user = User::factory()->create();
        $a = Address::create(['user_id' => $user->id, 'label' => 'A', 'address' => 'x']);

        $this->actingAs($user)->deleteJson("/api/addresses/{$a->id}")->assertOk();
        $this->assertDatabaseMissing('addresses', ['id' => $a->id]);
    }

    public function test_user_cannot_delete_others_address(): void
    {
        $a = Address::create(['user_id' => User::factory()->create()->id, 'label' => 'A', 'address' => 'x']);

        $this->actingAs(User::factory()->create())
            ->deleteJson("/api/addresses/{$a->id}")
            ->assertForbidden();

        $this->assertDatabaseHas('addresses', ['id' => $a->id]);
    }

    public function test_addresses_require_auth(): void
    {
        $this->getJson('/api/addresses')->assertUnauthorized();
    }
}
