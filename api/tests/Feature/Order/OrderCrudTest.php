<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderCrudTest extends TestCase
{
    use RefreshDatabase;

    private function validPayload(array $override = []): array
    {
        return array_merge([
            'title' => 'Tài liệu quan trọng',
            'pickup_address' => '123 Nguyen Trai, Q1, HCM',
            'delivery_address' => '456 Le Van Sy, Q3, HCM',
            'budget_price' => 80000,
        ], $override);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public function test_sender_can_create_order(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/orders', $this->validPayload())
            ->assertCreated()
            ->assertJsonFragment([
                'title' => 'Tài liệu quan trọng',
                'status' => 'open',
                'sender_id' => $user->id,
            ]);

        $this->assertDatabaseHas('orders', ['sender_id' => $user->id]);
    }

    public function test_create_order_requires_auth(): void
    {
        $this->postJson('/api/orders', $this->validPayload())->assertUnauthorized();
    }

    public function test_create_order_validates_required_fields(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/orders', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['title', 'pickup_address', 'delivery_address', 'budget_price']);
    }

    public function test_budget_price_must_be_positive(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->postJson('/api/orders', $this->validPayload(['budget_price' => -1]))
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['budget_price']);
    }

    // ── List: my orders ───────────────────────────────────────────────────────

    public function test_sender_sees_only_own_orders(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();

        Order::factory()->create(['sender_id' => $user->id]);
        Order::factory()->create(['sender_id' => $other->id]);

        $res = $this->actingAs($user)->getJson('/api/orders/mine');

        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertEquals($user->id, $res->json('data.0.sender_id'));
    }

    public function test_my_orders_is_paginated(): void
    {
        $user = User::factory()->create();
        Order::factory()->count(20)->create(['sender_id' => $user->id]);

        $this->actingAs($user)
            ->getJson('/api/orders/mine')
            ->assertOk()
            ->assertJsonStructure(['data', 'current_page', 'last_page', 'total']);
    }

    // ── List: open orders ────────────────────────────────────────────────────

    public function test_driver_can_list_open_orders(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();

        Order::factory()->count(3)->create(['sender_id' => $sender->id, 'status' => 'open']);
        Order::factory()->create(['sender_id' => $sender->id, 'status' => 'cancelled']);

        $res = $this->actingAs($driver)->getJson('/api/orders/open');

        $res->assertOk();
        $this->assertCount(3, $res->json('data'));
    }

    public function test_open_orders_excludes_own_orders(): void
    {
        $driver = User::factory()->driver()->create();
        Order::factory()->create(['sender_id' => $driver->id, 'status' => 'open']);
        Order::factory()->create(['sender_id' => User::factory()->create()->id, 'status' => 'open']);

        $res = $this->actingAs($driver)->getJson('/api/orders/open');

        $this->assertCount(1, $res->json('data'));
    }

    public function test_non_driver_cannot_list_open_orders(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/orders/open')
            ->assertForbidden();
    }

    // ── Show ─────────────────────────────────────────────────────────────────

    public function test_sender_can_view_own_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['sender_id' => $user->id]);

        $this->actingAs($user)
            ->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonFragment(['id' => $order->id]);
    }

    public function test_anyone_authenticated_can_view_open_order(): void
    {
        $order = Order::factory()->open()->create();
        $viewer = User::factory()->create();

        $this->actingAs($viewer)
            ->getJson("/api/orders/{$order->id}")
            ->assertOk();
    }

    public function test_cannot_view_closed_order_as_stranger(): void
    {
        $order = Order::factory()->cancelled()->create();
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->getJson("/api/orders/{$order->id}")
            ->assertForbidden();
    }

    public function test_show_returns_bids_with_driver_profile_and_rating(): void
    {
        $sender = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);

        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update([
            'vehicle_type' => 'motorbike',
            'rating_avg' => 4.5,
            'rating_count' => 8,
        ]);

        \App\Models\Bid::factory()->create([
            'order_id' => $order->id,
            'driver_id' => $driver->id,
            'price' => 70000,
        ]);

        $res = $this->actingAs($sender)
            ->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonStructure([
                'bids' => [
                    ['id', 'price', 'status', 'driver' => ['id', 'name', 'driver_profile' => ['vehicle_type', 'rating_avg', 'rating_count']]],
                ],
            ]);

        $bid = $res->json('bids.0');
        $this->assertEquals($driver->id, $bid['driver']['id']);
        $this->assertEquals('motorbike', $bid['driver']['driver_profile']['vehicle_type']);
        $this->assertEquals(8, $bid['driver']['driver_profile']['rating_count']);
    }
}
