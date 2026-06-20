<?php

namespace Tests\Feature\Order;

use App\Models\Bid;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderWorkflowTest extends TestCase
{
    use RefreshDatabase;

    // ── Cancel ────────────────────────────────────────────────────────────────

    public function test_sender_can_cancel_open_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertOk()
            ->assertJsonFragment(['status' => 'cancelled']);

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'cancelled']);
    }

    public function test_sender_cannot_cancel_in_progress_order(): void
    {
        $user = User::factory()->create();
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create(['sender_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertUnprocessable();
    }

    public function test_other_user_cannot_cancel_order(): void
    {
        $order = Order::factory()->open()->create();
        $other = User::factory()->create();

        $this->actingAs($other)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertForbidden();
    }

    // ── Accept bid ────────────────────────────────────────────────────────────

    public function test_sender_can_accept_bid(): void
    {
        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);
        $bid = Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $driver->id, 'price' => 70000]);

        $res = $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$bid->id}");

        $res->assertOk()
            ->assertJsonFragment(['status' => 'in_progress', 'driver_id' => $driver->id, 'final_price' => 70000.0]);

        $this->assertDatabaseHas('bids', ['id' => $bid->id, 'status' => 'accepted']);
    }

    public function test_accepting_one_bid_rejects_others(): void
    {
        $sender = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);

        $accepted = Bid::factory()->create(['order_id' => $order->id]);
        $other1 = Bid::factory()->create(['order_id' => $order->id]);
        $other2 = Bid::factory()->create(['order_id' => $order->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$accepted->id}")
            ->assertOk();

        $this->assertDatabaseHas('bids', ['id' => $other1->id, 'status' => 'rejected']);
        $this->assertDatabaseHas('bids', ['id' => $other2->id, 'status' => 'rejected']);
    }

    public function test_cannot_accept_bid_on_non_open_order(): void
    {
        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create(['sender_id' => $sender->id]);
        $bid = Bid::factory()->create(['order_id' => $order->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$bid->id}")
            ->assertUnprocessable();
    }

    public function test_cannot_accept_bid_belonging_to_another_order(): void
    {
        $sender = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);
        $otherOrder = Order::factory()->open()->create();
        $bid = Bid::factory()->create(['order_id' => $otherOrder->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$bid->id}")
            ->assertUnprocessable();
    }

    public function test_non_sender_cannot_accept_bid(): void
    {
        $order = Order::factory()->open()->create();
        $bid = Bid::factory()->create(['order_id' => $order->id]);
        $other = User::factory()->create();

        $this->actingAs($other)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$bid->id}")
            ->assertForbidden();
    }

    // ── Deliver ───────────────────────────────────────────────────────────────

    public function test_driver_can_mark_order_as_delivered(): void
    {
        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create(['sender_id' => $sender->id]);

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->id}/deliver")
            ->assertOk()
            ->assertJsonFragment(['status' => 'delivered'])
            ->assertJsonStructure(['sender', 'driver', 'bids']);

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'delivered']);
        $this->assertNotNull(Order::find($order->id)->delivered_at);
    }

    public function test_driver_can_deliver_with_note(): void
    {
        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create(['sender_id' => $sender->id]);

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->id}/deliver", ['delivery_note' => 'Đã giao cho bảo vệ tầng 1'])
            ->assertOk()
            ->assertJsonFragment(['status' => 'delivered', 'delivery_note' => 'Đã giao cho bảo vệ tầng 1']);

        $this->assertDatabaseHas('orders', [
            'id' => $order->id,
            'status' => 'delivered',
            'delivery_note' => 'Đã giao cho bảo vệ tầng 1',
        ]);
    }

    public function test_non_driver_cannot_mark_as_delivered(): void
    {
        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create(['sender_id' => $sender->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/deliver")
            ->assertForbidden();
    }

    public function test_cannot_deliver_open_order(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->open()->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->id}/deliver")
            ->assertForbidden();
    }
}
