<?php

namespace Tests\Feature\Order;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProofOfDeliveryTest extends TestCase
{
    use RefreshDatabase;

    public function test_driver_can_deliver_with_a_proof_photo(): void
    {
        Storage::fake('local');
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create();

        $this->actingAs($driver)
            ->post("/api/orders/{$order->order_code}/deliver", [
                'photo' => UploadedFile::fake()->image('proof.jpg'),
            ], ['Accept' => 'application/json'])
            ->assertOk();

        $order->refresh();
        $this->assertNotNull($order->proof_photo);
        $this->assertEquals('delivered', $order->status->value);
        Storage::disk('local')->assertExists($order->proof_photo);
    }

    public function test_deliver_without_photo_still_works(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/deliver")
            ->assertOk();

        $this->assertNull($order->refresh()->proof_photo);
    }

    public function test_deliver_rejects_non_image(): void
    {
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create();

        $this->actingAs($driver)
            ->post("/api/orders/{$order->order_code}/deliver", [
                'photo' => UploadedFile::fake()->create('doc.pdf', 100, 'application/pdf'),
            ], ['Accept' => 'application/json'])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['photo']);
    }

    public function test_track_exposes_has_proof(): void
    {
        Storage::fake('local');
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create();

        $this->actingAs($driver)
            ->post("/api/orders/{$order->order_code}/deliver", [
                'photo' => UploadedFile::fake()->image('p.jpg'),
            ], ['Accept' => 'application/json'])
            ->assertOk();

        $this->getJson("/api/track/{$order->order_code}")
            ->assertOk()
            ->assertJsonPath('has_proof', true);
    }

    public function test_public_proof_photo_is_served(): void
    {
        Storage::fake('local');
        $driver = User::factory()->driver()->create();
        $order = Order::factory()->inProgress($driver)->create();

        $this->actingAs($driver)
            ->post("/api/orders/{$order->order_code}/deliver", [
                'photo' => UploadedFile::fake()->image('p.jpg'),
            ], ['Accept' => 'application/json'])
            ->assertOk();

        $this->get("/api/track/{$order->order_code}/proof")->assertOk();
    }

    public function test_proof_photo_returns_404_when_none(): void
    {
        $order = Order::factory()->open()->create();

        $this->get("/api/track/{$order->order_code}/proof")->assertNotFound();
    }
}
