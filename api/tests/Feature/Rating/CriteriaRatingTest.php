<?php

namespace Tests\Feature\Rating;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CriteriaRatingTest extends TestCase
{
    use RefreshDatabase;

    public function test_sender_can_rate_driver_with_criteria(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();
        $order = Order::factory()->delivered($driver)->create(['sender_id' => $sender->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/rate", [
                'score' => 5,
                'comment' => 'Tốt',
                'score_punctuality' => 5,
                'score_attitude' => 4,
                'score_care' => 5,
            ])->assertCreated();

        $this->assertDatabaseHas('ratings', [
            'order_id' => $order->id,
            'score_punctuality' => 5,
            'score_attitude' => 4,
            'score_care' => 5,
        ]);
    }

    public function test_criteria_are_optional(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();
        $order = Order::factory()->delivered($driver)->create(['sender_id' => $sender->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/rate", ['score' => 4])
            ->assertCreated();

        $this->assertDatabaseHas('ratings', [
            'order_id' => $order->id,
            'score' => 4,
            'score_punctuality' => null,
        ]);
    }

    public function test_criteria_out_of_range_is_rejected(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();
        $order = Order::factory()->delivered($driver)->create(['sender_id' => $sender->id]);

        $this->actingAs($sender)
            ->postJson("/api/orders/{$order->order_code}/rate", [
                'score' => 5,
                'score_attitude' => 9,
            ])->assertUnprocessable()
            ->assertJsonValidationErrors(['score_attitude']);
    }

    public function test_profile_returns_criteria_averages(): void
    {
        $driver = User::factory()->driver()->create();
        $sender = User::factory()->create();
        $order = Order::factory()->delivered($driver)->create(['sender_id' => $sender->id]);

        $this->actingAs($sender)->postJson("/api/orders/{$order->order_code}/rate", [
            'score' => 5,
            'score_punctuality' => 4,
            'score_attitude' => 5,
            'score_care' => 3,
        ])->assertCreated();

        $this->actingAs(User::factory()->create())
            ->getJson("/api/drivers/{$driver->id}/profile")
            ->assertOk()
            ->assertJsonPath('criteria.punctuality', 4)
            ->assertJsonPath('criteria.attitude', 5)
            ->assertJsonPath('criteria.care', 3);
    }
}
