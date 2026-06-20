<?php

namespace Tests\Feature\Order;

use App\Enums\BidStatus;
use App\Enums\OrderStatus;
use App\Models\Bid;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * These tests verify that the pessimistic-locking strategy correctly prevents
 * race conditions. True concurrency cannot be simulated in a single PHP process,
 * so each test emulates the "losing" request's perspective: a request that
 * arrives after the state has already been changed by a concurrent winner.
 */
class ConcurrencyTest extends TestCase
{
    use RefreshDatabase;

    // ── acceptBid ─────────────────────────────────────────────────────────────

    public function test_second_accept_bid_on_same_order_returns_422(): void
    {
        $sender = User::factory()->create();
        $driver1 = User::factory()->driver()->create();
        $driver2 = User::factory()->driver()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);
        $bid1 = Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $driver1->id]);
        $bid2 = Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $driver2->id]);

        // First accept succeeds
        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$bid1->id}")
            ->assertOk()
            ->assertJsonFragment(['status' => OrderStatus::InProgress->value]);

        // Concurrent accept on same order — the order is now in_progress, must fail
        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$bid2->id}")
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Đơn không còn ở trạng thái mở.']);
    }

    public function test_only_one_driver_is_assigned_after_concurrent_accepts(): void
    {
        $sender = User::factory()->create();
        $driver1 = User::factory()->driver()->create();
        $driver2 = User::factory()->driver()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);
        $bid1 = Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $driver1->id]);
        $bid2 = Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $driver2->id]);

        $this->actingAs($sender)->postJson("/api/orders/{$order->id}/accept-bid/{$bid1->id}")->assertOk();
        $this->actingAs($sender)->postJson("/api/orders/{$order->id}/accept-bid/{$bid2->id}")->assertUnprocessable();

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'driver_id' => $driver1->id,
            'status' => OrderStatus::InProgress->value,
        ]);

        // bid2 must still be pending (not accepted) — the second call had no effect
        $this->assertDatabaseHas('bids', [
            'id' => $bid2->id,
            'status' => BidStatus::Rejected->value,
        ]);
    }

    public function test_accept_bid_on_cancelled_order_returns_422(): void
    {
        $sender = User::factory()->create();
        $order = Order::factory()->cancelled()->create(['sender_id' => $sender->id]);
        $bid = Bid::factory()->create(['order_id' => $order->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$bid->id}")
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Đơn không còn ở trạng thái mở.']);
    }

    // ── BidController::store ──────────────────────────────────────────────────

    public function test_second_bid_from_same_driver_returns_422(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create();

        // First bid succeeds
        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->id}/bids", ['price' => 50000])
            ->assertCreated();

        // Concurrent duplicate bid — must fail
        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->id}/bids", ['price' => 55000])
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Bạn đã bid đơn này rồi.']);
    }

    public function test_bid_on_just_accepted_order_returns_422(): void
    {
        $sender = User::factory()->create();
        $driver1 = User::factory()->driver()->create();
        $driver2 = User::factory()->driver()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);
        $bid1 = Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $driver1->id]);

        // Sender accepts driver1's bid (order becomes in_progress)
        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$bid1->id}")
            ->assertOk();

        // driver2 tries to bid — order no longer open
        $this->actingAs($driver2)
            ->postJson("/api/orders/{$order->id}/bids", ['price' => 40000])
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Đơn không còn nhận bid.']);
    }

    // ── cancel ────────────────────────────────────────────────────────────────

    public function test_cancel_after_accept_returns_422(): void
    {
        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);
        $bid = Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $driver->id]);

        // Accept transitions order to in_progress
        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$bid->id}")
            ->assertOk();

        // Cancel after accept must fail — order is now in_progress
        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Chỉ có thể hủy đơn đang mở hoặc chưa đăng.']);
    }

    public function test_double_cancel_returns_422(): void
    {
        $sender = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);

        $this->actingAs($sender)->postJson("/api/orders/{$order->id}/cancel")->assertOk();
        $this->actingAs($sender)->postJson("/api/orders/{$order->id}/cancel")->assertUnprocessable();
    }

    // ── deliver ───────────────────────────────────────────────────────────────

    public function test_double_deliver_returns_422(): void
    {
        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create(['sender_id' => $sender->id]);

        $this->actingAs($driver)->postJson("/api/orders/{$order->id}/deliver")->assertOk();
        $this->actingAs($driver)->postJson("/api/orders/{$order->id}/deliver")->assertUnprocessable();
    }
}
