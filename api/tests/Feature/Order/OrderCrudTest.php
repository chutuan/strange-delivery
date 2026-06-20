<?php

namespace Tests\Feature\Order;

use App\Enums\OrderStatus;
use App\Models\Bid;
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
            'recipient_name' => 'Nguyễn Văn A',
            'recipient_phone' => '0901234567',
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
                'status' => OrderStatus::Draft->value,
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

        Order::factory()->count(3)->create(['sender_id' => $sender->id, 'status' => OrderStatus::Open]);
        Order::factory()->create(['sender_id' => $sender->id, 'status' => OrderStatus::Cancelled]);

        $res = $this->actingAs($driver)->getJson('/api/orders/open');

        $res->assertOk();
        $this->assertCount(3, $res->json('data'));
    }

    public function test_open_orders_excludes_own_orders(): void
    {
        $driver = User::factory()->driver()->create();
        Order::factory()->create(['sender_id' => $driver->id, 'status' => OrderStatus::Open]);
        Order::factory()->create(['sender_id' => User::factory()->create()->id, 'status' => OrderStatus::Open]);

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

    // ── Filter & search open orders ────────────────────────────────────────────

    public function test_open_orders_can_filter_by_keyword(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();

        Order::factory()->open()->create(['sender_id' => $sender->id, 'title' => 'Giao laptop gấp']);
        Order::factory()->open()->create(['sender_id' => $sender->id, 'title' => 'Giao tài liệu']);

        $res = $this->actingAs($driver)->getJson('/api/orders/open?q=laptop');

        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertEquals('Giao laptop gấp', $res->json('data.0.title'));
    }

    public function test_open_orders_can_filter_by_price_range(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();

        Order::factory()->open()->create(['sender_id' => $sender->id, 'budget_price' => 20000]);
        Order::factory()->open()->create(['sender_id' => $sender->id, 'budget_price' => 80000]);
        Order::factory()->open()->create(['sender_id' => $sender->id, 'budget_price' => 200000]);

        $res = $this->actingAs($driver)->getJson('/api/orders/open?min_price=50000&max_price=100000');

        $res->assertOk();
        $this->assertCount(1, $res->json('data'));
        $this->assertEquals(80000, $res->json('data.0.budget_price'));
    }

    public function test_open_orders_can_sort_by_price(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();

        Order::factory()->open()->create(['sender_id' => $sender->id, 'budget_price' => 90000]);
        Order::factory()->open()->create(['sender_id' => $sender->id, 'budget_price' => 30000]);

        $res = $this->actingAs($driver)->getJson('/api/orders/open?sort=price_asc');

        $res->assertOk();
        $this->assertEquals(30000, $res->json('data.0.budget_price'));
    }

    // ── Show ─────────────────────────────────────────────────────────────────

    public function test_sender_can_view_own_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['sender_id' => $user->id]);

        $this->actingAs($user)
            ->getJson("/api/orders/{$order->order_code}")
            ->assertOk()
            ->assertJsonFragment(['id' => $order->id]);
    }

    public function test_anyone_authenticated_can_view_open_order(): void
    {
        $order = Order::factory()->open()->create();
        $viewer = User::factory()->create();

        $this->actingAs($viewer)
            ->getJson("/api/orders/{$order->order_code}")
            ->assertOk();
    }

    public function test_outsider_viewing_open_order_does_not_see_bids_or_sender_phone(): void
    {
        $sender = User::factory()->create(['phone' => '0909123456']);
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);
        Bid::factory()->create(['order_id' => $order->id, 'price' => 70000, 'note' => 'secret']);

        $res = $this->actingAs(User::factory()->driver()->create())
            ->getJson("/api/orders/{$order->order_code}")
            ->assertOk();

        // Competing drivers must not see other bids (prices/notes) nor the sender's phone.
        $this->assertEmpty($res->json('bids'));
        $this->assertArrayNotHasKey('phone', $res->json('sender'));
        $res->assertDontSee('0909123456')->assertDontSee('secret');
    }

    public function test_cannot_view_closed_order_as_stranger(): void
    {
        $order = Order::factory()->cancelled()->create();
        $stranger = User::factory()->create();

        $this->actingAs($stranger)
            ->getJson("/api/orders/{$order->order_code}")
            ->assertForbidden();
    }

    public function test_show_returns_bids_with_driver_profile_and_rating(): void
    {
        $sender = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);

        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update([
            'rating_avg' => 4.5,
            'rating_count' => 8,
        ]);

        Bid::factory()->create([
            'order_id' => $order->id,
            'driver_id' => $driver->id,
            'price' => 70000,
        ]);

        $res = $this->actingAs($sender)
            ->getJson("/api/orders/{$order->order_code}")
            ->assertOk()
            ->assertJsonStructure([
                'bids' => [
                    ['id', 'price', 'status', 'driver' => ['id', 'name', 'driver_profile' => ['rating_avg', 'rating_count']]],
                ],
            ]);

        $bid = $res->json('bids.0');
        $this->assertEquals($driver->id, $bid['driver']['id']);
        $this->assertEquals(8, $bid['driver']['driver_profile']['rating_count']);
    }
}
