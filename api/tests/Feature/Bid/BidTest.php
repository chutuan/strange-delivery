<?php

namespace Tests\Feature\Bid;

use App\Enums\BidStatus;
use App\Models\Bid;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BidTest extends TestCase
{
    use RefreshDatabase;

    // ── List ─────────────────────────────────────────────────────────────────

    public function test_authenticated_user_can_list_bids(): void
    {
        $order = Order::factory()->open()->create();
        Bid::factory()->count(3)->create(['order_id' => $order->id]);

        $this->actingAs(User::factory()->create())
            ->getJson("/api/orders/{$order->order_code}/bids")
            ->assertOk()
            ->assertJsonCount(3);
    }

    // ── Create ────────────────────────────────────────────────────────────────

    public function test_driver_can_bid_on_open_order(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 60000])
            ->assertCreated()
            ->assertJsonFragment(['price' => 60000.0, 'status' => BidStatus::Pending->value]);

        $this->assertDatabaseHas('bids', [
            'order_id' => $order->id,
            'driver_id' => $driver->id,
            'price' => 60000,
        ]);
    }

    public function test_driver_can_bid_higher_than_budget(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create(['budget_price' => 50000]);

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 120000])
            ->assertCreated();
    }

    public function test_driver_can_bid_lower_than_budget(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create(['budget_price' => 100000]);

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 30000])
            ->assertCreated();
    }

    public function test_non_driver_cannot_bid(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->open()->create();

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 60000])
            ->assertForbidden();
    }

    public function test_offline_driver_cannot_bid(): void
    {
        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update(['is_active' => false]);
        $order = Order::factory()->open()->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 60000])
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Bạn đang offline. Bật online để có thể báo giá.']);
    }

    public function test_sender_cannot_bid_own_order(): void
    {
        $sender = User::factory()->driver()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 60000])
            ->assertUnprocessable();
    }

    public function test_driver_cannot_bid_twice_on_same_order(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create();
        Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $driver->id]);

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 70000])
            ->assertUnprocessable();
    }

    public function test_cannot_bid_on_non_open_order(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->cancelled()->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 60000])
            ->assertUnprocessable();
    }

    public function test_bid_price_must_be_non_negative(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => -1])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['price']);
    }

    public function test_bid_requires_auth(): void
    {
        $order = Order::factory()->open()->create();

        $this->postJson("/api/orders/{$order->order_code}/bids", ['price' => 60000])
            ->assertUnauthorized();
    }

    // ── Withdraw ────────────────────────────────────────────────────────────────

    public function test_driver_can_withdraw_own_pending_bid(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create();
        $bid = Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $driver->id]);

        $this->actingAs($driver)
            ->deleteJson("/api/orders/{$order->order_code}/bids/{$bid->id}")
            ->assertOk();

        $this->assertDatabaseMissing('bids', ['id' => $bid->id]);
    }

    public function test_driver_cannot_withdraw_others_bid(): void
    {
        $order = Order::factory()->open()->create();
        $bid = Bid::factory()->create(['order_id' => $order->id]);

        $this->actingAs(User::factory()->driver()->create())
            ->deleteJson("/api/orders/{$order->order_code}/bids/{$bid->id}")
            ->assertForbidden();
    }

    public function test_cannot_withdraw_accepted_bid(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create();
        $bid = Bid::factory()->accepted()->create(['order_id' => $order->id, 'driver_id' => $driver->id]);

        $this->actingAs($driver)
            ->deleteJson("/api/orders/{$order->order_code}/bids/{$bid->id}")
            ->assertUnprocessable();
    }
}
