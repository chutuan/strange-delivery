<?php

namespace Tests\Feature\Rating;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RatingTest extends TestCase
{
    use RefreshDatabase;

    private function deliveredOrderWithDriver(): array
    {
        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->delivered($driver)->create(['sender_id' => $sender->id]);
        return [$sender, $driver, $order];
    }

    // ── Happy path ────────────────────────────────────────────────────────────

    public function test_sender_can_rate_driver_after_delivery(): void
    {
        [$sender, $driver, $order] = $this->deliveredOrderWithDriver();

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/rate", ['score' => 5, 'comment' => 'Giao nhanh!'])
            ->assertCreated()
            ->assertJsonFragment(['score' => 5, 'comment' => 'Giao nhanh!']);

        $this->assertDatabaseHas('ratings', [
            'order_id' => $order->id,
            'sender_id' => $sender->id,
            'driver_id' => $driver->id,
            'score' => 5,
        ]);
    }

    public function test_rating_updates_driver_rating_avg(): void
    {
        [$sender, $driver, $order] = $this->deliveredOrderWithDriver();

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/rate", ['score' => 4])
            ->assertCreated();

        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $driver->id,
            'rating_count' => 1,
            'rating_avg' => 4.0,
        ]);
    }

    public function test_rating_avg_accumulates_across_multiple_ratings(): void
    {
        $driver = User::factory()->driver()->create();

        $sender1 = User::factory()->create();
        $order1 = Order::factory()->delivered($driver)->create(['sender_id' => $sender1->id]);
        $this->actingAs($sender1)->postJson("/api/orders/{$order1->order_code}/rate", ['score' => 5]);

        $sender2 = User::factory()->create();
        $order2 = Order::factory()->delivered($driver)->create(['sender_id' => $sender2->id]);
        $this->actingAs($sender2)->postJson("/api/orders/{$order2->order_code}/rate", ['score' => 3]);

        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $driver->id,
            'rating_count' => 2,
            'rating_avg' => 4.0, // (5+3)/2
        ]);
    }

    // ── Business rules ────────────────────────────────────────────────────────

    public function test_cannot_rate_same_order_twice(): void
    {
        [$sender, , $order] = $this->deliveredOrderWithDriver();

        $this->actingAs($sender)->postJson("/api/orders/{$order->order_code}/rate", ['score' => 5]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/rate", ['score' => 4])
            ->assertUnprocessable();
    }

    public function test_driver_cannot_rate_their_own_order(): void
    {
        [, $driver, $order] = $this->deliveredOrderWithDriver();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/rate", ['score' => 5])
            ->assertForbidden();
    }

    public function test_cannot_rate_undelivered_order(): void
    {
        $sender = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/rate", ['score' => 5])
            ->assertUnprocessable();
    }

    public function test_score_must_be_between_1_and_5(): void
    {
        [$sender, , $order] = $this->deliveredOrderWithDriver();

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/rate", ['score' => 6])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['score']);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/rate", ['score' => 0])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['score']);
    }

    public function test_rating_requires_auth(): void
    {
        $order = Order::factory()->delivered()->create();

        $this->postJson("/api/orders/{$order->order_code}/rate", ['score' => 5])
            ->assertUnauthorized();
    }
}
