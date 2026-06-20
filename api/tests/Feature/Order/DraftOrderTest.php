<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DraftOrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_is_created_as_draft_by_default(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'title' => 'Tài liệu',
            'pickup_address' => '10 Lê Lợi, Q1',
            'delivery_address' => '5 Nguyễn Huệ, Q1',
            'budget_price' => 50000,
        ]);

        $response->assertCreated()->assertJsonFragment(['status' => 'draft']);
        $this->assertDatabaseHas('orders', ['title' => 'Tài liệu', 'status' => 'draft']);
    }

    public function test_order_can_be_published_immediately_on_create(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/orders', [
            'title' => 'Tài liệu',
            'pickup_address' => '10 Lê Lợi, Q1',
            'delivery_address' => '5 Nguyễn Huệ, Q1',
            'budget_price' => 50000,
            'publish' => true,
        ]);

        $response->assertCreated()->assertJsonFragment(['status' => 'open']);
    }

    public function test_required_before_is_stored(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)->postJson('/api/orders', [
            'title' => 'Giao gấp',
            'pickup_address' => '10 Lê Lợi',
            'delivery_address' => '5 Nguyễn Huệ',
            'budget_price' => 80000,
            'required_before' => '2026-06-21 17:00:00',
        ])->assertCreated();

        $this->assertDatabaseHas('orders', [
            'title' => 'Giao gấp',
            'required_before' => '2026-06-21 17:00:00',
        ]);
    }

    public function test_sender_can_publish_draft(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->draft()->create(['sender_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->id}/publish")
            ->assertOk()
            ->assertJsonFragment(['status' => 'open']);

        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => 'open']);
    }

    public function test_other_user_cannot_publish_draft(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $order = Order::factory()->draft()->create(['sender_id' => $owner->id]);

        $this->actingAs($other)
            ->postJson("/api/orders/{$order->id}/publish")
            ->assertForbidden();
    }

    public function test_cannot_publish_already_open_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->id}/publish")
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Chỉ có thể đăng đơn nháp.']);
    }

    public function test_sender_can_cancel_draft_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->draft()->create(['sender_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertOk()
            ->assertJsonFragment(['status' => 'cancelled']);
    }

    public function test_draft_orders_are_not_visible_to_drivers_in_open_orders(): void
    {
        $driver = User::factory()->driver()->create();
        Order::factory()->draft()->create();

        $this->actingAs($driver)
            ->getJson('/api/orders/open')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_sender_can_view_their_draft_order(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->draft()->create(['sender_id' => $user->id]);

        $this->actingAs($user)
            ->getJson("/api/orders/{$order->id}")
            ->assertOk()
            ->assertJsonFragment(['status' => 'draft']);
    }

    public function test_other_user_cannot_view_draft_order(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $order = Order::factory()->draft()->create(['sender_id' => $owner->id]);

        $this->actingAs($other)
            ->getJson("/api/orders/{$order->id}")
            ->assertForbidden();
    }
}
