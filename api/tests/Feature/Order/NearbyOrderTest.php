<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class NearbyOrderTest extends TestCase
{
    use RefreshDatabase;

    // ── Distance sorting ─────────────────────────────────────────────────────

    public function test_open_orders_include_distance_when_lat_lng_provided(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();

        Order::factory()->open()->create([
            'sender_id' => $sender->id,
            'pickup_lat' => 10.776,
            'pickup_lng' => 106.700,
        ]);

        $res = $this->actingAs($driver)
            ->getJson('/api/orders/open?lat=10.780&lng=106.705');

        $res->assertOk();
        $this->assertNotNull($res->json('data.0.distance_km'));
    }

    public function test_open_orders_sorted_nearest_first(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();

        // Far order: ~10km away
        Order::factory()->open()->create([
            'sender_id' => $sender->id,
            'title' => 'Xa',
            'pickup_lat' => 10.870,
            'pickup_lng' => 106.700,
        ]);

        // Near order: ~1km away
        Order::factory()->open()->create([
            'sender_id' => $sender->id,
            'title' => 'Gần',
            'pickup_lat' => 10.777,
            'pickup_lng' => 106.700,
        ]);

        $res = $this->actingAs($driver)
            ->getJson('/api/orders/open?lat=10.780&lng=106.700&sort=nearest');

        $res->assertOk();
        $this->assertEquals('Gần', $res->json('data.0.title'));
    }

    public function test_orders_without_coords_have_null_distance(): void
    {
        $driver = User::factory()->driver()->create();
        Order::factory()->open()->create(['sender_id' => User::factory()->create()->id]);

        $res = $this->actingAs($driver)
            ->getJson('/api/orders/open?lat=10.780&lng=106.700');

        $res->assertOk();
        $this->assertNull($res->json('data.0.distance_km'));
    }

    public function test_open_orders_work_without_lat_lng(): void
    {
        $driver = User::factory()->driver()->create();
        Order::factory()->open()->create(['sender_id' => User::factory()->create()->id]);

        $this->actingAs($driver)
            ->getJson('/api/orders/open')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    // ── Driver location update ────────────────────────────────────────────────

    public function test_driver_can_update_location(): void
    {
        $driver = User::factory()->driver()->create();

        $this->actingAs($driver)
            ->putJson('/api/driver/location', ['lat' => 10.776, 'lng' => 106.700])
            ->assertOk()
            ->assertJson(['ok' => true]);

        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $driver->id,
            'current_lat' => 10.776,
            'current_lng' => 106.700,
        ]);
    }

    public function test_driver_can_update_location_with_push_token(): void
    {
        $driver = User::factory()->driver()->create();

        $this->actingAs($driver)
            ->putJson('/api/driver/location', [
                'lat' => 10.776,
                'lng' => 106.700,
                'push_token' => 'ExponentPushToken[abc123]',
            ])
            ->assertOk();

        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $driver->id,
            'push_token' => 'ExponentPushToken[abc123]',
        ]);
    }

    public function test_non_driver_cannot_update_location(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/driver/location', ['lat' => 10.776, 'lng' => 106.700])
            ->assertNotFound();
    }

    // ── Notification radius ───────────────────────────────────────────────────

    public function test_driver_can_set_notification_radius(): void
    {
        $driver = User::factory()->driver()->create();

        $this->actingAs($driver)
            ->putJson('/api/driver/profile', ['notification_radius_km' => 5])
            ->assertOk();

        $this->assertDatabaseHas('driver_profiles', [
            'user_id' => $driver->id,
            'notification_radius_km' => 5,
        ]);
    }

    public function test_notification_radius_must_be_between_1_and_20(): void
    {
        $driver = User::factory()->driver()->create();

        $this->actingAs($driver)
            ->putJson('/api/driver/profile', ['notification_radius_km' => 0])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['notification_radius_km']);

        $this->actingAs($driver)
            ->putJson('/api/driver/profile', ['notification_radius_km' => 25])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['notification_radius_km']);
    }

    // ── Nearby notification on publish ────────────────────────────────────────

    public function test_nearby_active_driver_gets_in_app_notification_when_order_published(): void
    {
        Http::fake();

        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();

        // Driver is online and located ~0.5km from pickup
        $driver->driverProfile->update([
            'current_lat' => 10.776,
            'current_lng' => 106.700,
            'notification_radius_km' => 3,
            'push_token' => 'ExponentPushToken[test]',
        ]);

        $order = Order::factory()->draft()->create([
            'sender_id' => $sender->id,
            'title' => 'Test order',
            'pickup_lat' => 10.778,
            'pickup_lng' => 106.701,
        ]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/publish")
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $driver->id,
            'type' => 'new_order_nearby',
            'order_id' => $order->id,
        ]);
    }

    public function test_far_driver_does_not_get_notification(): void
    {
        Http::fake();

        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();

        // Driver is ~15km away, radius 3km
        $driver->driverProfile->update([
            'current_lat' => 10.900,
            'current_lng' => 106.700,
            'notification_radius_km' => 3,
        ]);

        $order = Order::factory()->draft()->create([
            'sender_id' => $sender->id,
            'pickup_lat' => 10.776,
            'pickup_lng' => 106.700,
        ]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/publish")
            ->assertOk();

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $driver->id,
            'type' => 'new_order_nearby',
        ]);
    }

    public function test_offline_driver_does_not_get_notification(): void
    {
        Http::fake();

        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();

        $driver->driverProfile->update([
            'is_active' => false,
            'current_lat' => 10.777,
            'current_lng' => 106.700,
            'notification_radius_km' => 5,
        ]);

        $order = Order::factory()->draft()->create([
            'sender_id' => $sender->id,
            'pickup_lat' => 10.778,
            'pickup_lng' => 106.700,
        ]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/publish")
            ->assertOk();

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $driver->id,
            'type' => 'new_order_nearby',
        ]);
    }

    public function test_order_without_coords_sends_no_nearby_notification(): void
    {
        Http::fake();

        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();

        $driver->driverProfile->update([
            'current_lat' => 10.777,
            'current_lng' => 106.700,
            'notification_radius_km' => 5,
        ]);

        $order = Order::factory()->draft()->create(['sender_id' => $sender->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/publish")
            ->assertOk();

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $driver->id,
            'type' => 'new_order_nearby',
        ]);
    }

    public function test_nearby_notification_also_fires_on_immediate_publish(): void
    {
        Http::fake();

        $sender = User::factory()->create();
        $driver = User::factory()->driver()->create();

        $driver->driverProfile->update([
            'current_lat' => 10.776,
            'current_lng' => 106.700,
            'notification_radius_km' => 3,
        ]);

        $this->actingAs($sender)
            ->postJson('/api/orders', [
                'title' => 'Giao gấp',
                'pickup_address' => '10 Lê Lợi',
                'delivery_address' => '5 Nguyễn Huệ',
                'recipient_name' => 'Nguyễn Văn A',
                'recipient_phone' => '0901234567',
                'budget_price' => 50000,
                'pickup_lat' => 10.778,
                'pickup_lng' => 106.701,
                'publish' => true,
            ])
            ->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $driver->id,
            'type' => 'new_order_nearby',
        ]);
    }
}
