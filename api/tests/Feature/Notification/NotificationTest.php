<?php

namespace Tests\Feature\Notification;

use App\Models\Bid;
use App\Models\Notification;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    // ── Triggers ───────────────────────────────────────────────────────────────

    public function test_bidding_creates_notification_for_sender(): void
    {
        $sender = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);
        $driver = User::factory()->driver()->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->id}/bids", ['price' => 60000])
            ->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $sender->id,
            'type' => 'bid_placed',
            'order_id' => $order->id,
        ]);
    }

    public function test_accepting_bid_notifies_winning_and_rejected_drivers(): void
    {
        $sender = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);

        $winner = User::factory()->driver()->create();
        $loser = User::factory()->driver()->create();
        $winBid = Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $winner->id]);
        Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $loser->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/accept-bid/{$winBid->id}")
            ->assertOk();

        $this->assertDatabaseHas('notifications', ['user_id' => $winner->id, 'type' => 'bid_accepted']);
        $this->assertDatabaseHas('notifications', ['user_id' => $loser->id, 'type' => 'bid_rejected']);
    }

    public function test_delivering_notifies_sender(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->id}/deliver")
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $order->sender_id,
            'type' => 'order_delivered',
        ]);
    }

    public function test_cancelling_notifies_bidders(): void
    {
        $sender = User::factory()->create();
        $order = Order::factory()->open()->create(['sender_id' => $sender->id]);
        $driver = User::factory()->driver()->create();
        Bid::factory()->create(['order_id' => $order->id, 'driver_id' => $driver->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/cancel")
            ->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $driver->id,
            'type' => 'order_cancelled',
        ]);
    }

    public function test_rating_notifies_driver(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();
        $order = Order::factory()->delivered($driver)->create(['sender_id' => $sender->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->id}/rate", ['score' => 5])
            ->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $driver->id,
            'type' => 'rating_received',
        ]);
    }

    // ── Listing & reading ───────────────────────────────────────────────────────

    public function test_user_sees_only_own_notifications(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(2)->create(['user_id' => $user->id]);
        Notification::factory()->create(['user_id' => User::factory()->create()->id]);

        $res = $this->actingAs($user)->getJson('/api/notifications')->assertOk();

        $this->assertCount(2, $res->json('data'));
    }

    public function test_unread_count(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(3)->create(['user_id' => $user->id]);
        Notification::factory()->read()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->getJson('/api/notifications/unread-count')
            ->assertOk()
            ->assertJson(['count' => 3]);
    }

    public function test_mark_notification_read(): void
    {
        $user = User::factory()->create();
        $notification = Notification::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson("/api/notifications/{$notification->id}/read")
            ->assertOk();

        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_cannot_mark_others_notification_read(): void
    {
        $notification = Notification::factory()->create(['user_id' => User::factory()->create()->id]);

        $this->actingAs(User::factory()->create())
            ->postJson("/api/notifications/{$notification->id}/read")
            ->assertForbidden();
    }

    public function test_mark_all_read(): void
    {
        $user = User::factory()->create();
        Notification::factory()->count(4)->create(['user_id' => $user->id]);

        $this->actingAs($user)
            ->postJson('/api/notifications/read-all')
            ->assertOk();

        $this->assertEquals(0, $user->notifications()->whereNull('read_at')->count());
    }

    public function test_notifications_require_auth(): void
    {
        $this->getJson('/api/notifications')->assertUnauthorized();
    }
}
