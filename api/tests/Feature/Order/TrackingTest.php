<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TrackingTest extends TestCase
{
    use RefreshDatabase;

    public function test_anyone_can_track_an_open_order(): void
    {
        $order = Order::factory()->open()->create();

        $this->getJson("/api/track/{$order->id}")
            ->assertOk()
            ->assertJsonFragment(['id' => $order->id, 'status' => 'open'])
            ->assertJsonStructure(['id', 'title', 'status', 'pickup_address', 'delivery_address', 'created_at']);
    }

    public function test_track_returns_no_driver_when_order_is_open(): void
    {
        $order = Order::factory()->open()->create();

        $response = $this->getJson("/api/track/{$order->id}")->assertOk();

        $this->assertNull($response->json('driver'));
    }

    public function test_track_returns_driver_info_when_in_progress(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create();

        $response = $this->getJson("/api/track/{$order->id}")->assertOk();

        $response->assertJsonFragment(['status' => 'in_progress']);
        $this->assertNotNull($response->json('driver'));
        $this->assertNotNull($response->json('driver.name'));
        $this->assertArrayHasKey('vehicle_type', $response->json('driver'));
        $this->assertArrayHasKey('license_plate', $response->json('driver'));
    }

    public function test_track_returns_delivered_at_when_delivered(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->delivered($driver)->create();

        $response = $this->getJson("/api/track/{$order->id}")->assertOk();

        $response->assertJsonFragment(['status' => 'delivered']);
        $this->assertNotNull($response->json('delivered_at'));
    }

    public function test_track_returns_404_for_nonexistent_order(): void
    {
        $this->getJson('/api/track/99999')->assertNotFound();
    }

    public function test_track_does_not_expose_private_fields(): void
    {
        $order = Order::factory()->open()->create(['budget_price' => 100000]);

        $response = $this->getJson("/api/track/{$order->id}")->assertOk();

        $data = $response->json();
        $this->assertArrayNotHasKey('budget_price', $data);
        $this->assertArrayNotHasKey('final_price', $data);
        $this->assertArrayNotHasKey('sender_id', $data);
        $this->assertArrayNotHasKey('bids', $data);
    }

    public function test_track_requires_no_authentication(): void
    {
        $order = Order::factory()->open()->create();

        $this->withoutMiddleware()
            ->getJson("/api/track/{$order->id}")
            ->assertOk();
    }
}
