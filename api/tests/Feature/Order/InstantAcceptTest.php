<?php

namespace Tests\Feature\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstantAcceptTest extends TestCase
{
    use RefreshDatabase;

    private function instantOpenOrder(array $override = []): Order
    {
        return Order::factory()->open()->create(array_merge(['order_type' => 'instant'], $override));
    }

    // ── Happy path (issue #2: enum-vs-string made this always 422) ──────────────

    public function test_driver_can_accept_instant_order(): void
    {
        $driver = User::factory()->driver()->create();
        $order = $this->instantOpenOrder();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/accept")
            ->assertOk()
            ->assertJsonFragment([
                'status' => OrderStatus::InProgress->value,
                'driver_id' => $driver->id,
            ]);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'driver_id' => $driver->id,
            'status' => OrderStatus::InProgress->value,
        ]);
    }

    public function test_cannot_accept_non_instant_order(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create(['order_type' => 'bidding']);

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/accept")
            ->assertUnprocessable();
    }

    public function test_sender_cannot_self_accept_instant_order(): void
    {
        $sender = User::factory()->driver()->create();
        $order = $this->instantOpenOrder(['sender_id' => $sender->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/accept")
            ->assertUnprocessable();
    }

    public function test_non_driver_cannot_accept_instant_order(): void
    {
        $user = User::factory()->create();
        $order = $this->instantOpenOrder();

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->order_code}/accept")
            ->assertForbidden();
    }

    // ── Race / TOCTOU (issue #5) ────────────────────────────────────────────────

    public function test_second_driver_accepting_taken_instant_order_returns_422(): void
    {
        $driver1 = User::factory()->driver()->create();
        $driver2 = User::factory()->driver()->create();
        $order = $this->instantOpenOrder();

        // First driver wins
        $this->actingAs($driver1)
            ->postJson("/api/orders/{$order->order_code}/accept")
            ->assertOk();

        // Concurrent accept on the now in_progress order must fail — no double-assign
        $this->actingAs($driver2)
            ->postJson("/api/orders/{$order->order_code}/accept")
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Đơn này không còn mở.']);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'driver_id' => $driver1->id,
        ]);
    }

    public function test_driver_with_active_instant_order_cannot_accept_another(): void
    {
        $driver = User::factory()->driver()->create();
        Order::factory()->inProgress($driver)->create(['order_type' => 'instant']);
        $order = $this->instantOpenOrder();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/accept")
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Bạn đang có đơn giao luôn chưa hoàn thành.']);
    }
}
