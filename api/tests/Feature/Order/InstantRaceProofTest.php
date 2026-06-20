<?php

namespace Tests\Feature\Order;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InstantRaceProofTest extends TestCase
{
    use RefreshDatabase;

    public function test_driver_can_accept_instant_open_order(): void
    {
        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();

        $order = Order::factory()->open()->create([
            'sender_id'  => $sender->id,
            'order_type' => 'instant',
        ]);

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/accept")
            ->assertOk()
            ->assertJsonFragment([
                'status'    => OrderStatus::InProgress->value,
                'driver_id' => $driver->id,
            ]);

        $this->assertDatabaseHas('orders', [
            'id'        => $order->id,
            'status'    => OrderStatus::InProgress->value,
            'driver_id' => $driver->id,
        ]);
    }

    public function test_driver_cannot_accept_non_open_instant_order(): void
    {
        $driver      = User::factory()->driver()->create();
        $otherDriver = User::factory()->driver()->create();

        $order = Order::factory()->inProgress($otherDriver)->create([
            'order_type' => 'instant',
        ]);

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/accept")
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Đơn này không còn mở.']);
    }

    public function test_sender_cannot_self_accept_instant_order(): void
    {
        $sender = User::factory()->driver()->create();
        $order  = Order::factory()->open()->create([
            'sender_id'  => $sender->id,
            'order_type' => 'instant',
        ]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/accept")
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Không thể tự nhận đơn của mình.']);
    }
}
