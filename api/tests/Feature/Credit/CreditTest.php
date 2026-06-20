<?php

namespace Tests\Feature\Credit;

use App\Models\BankSetting;
use App\Models\CreditTransaction;
use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CreditTest extends TestCase
{
    use RefreshDatabase;

    // ── Bid deduction ─────────────────────────────────────────────────────────

    public function test_bid_deducts_one_credit(): void
    {
        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update(['credits' => 5]);
        $order = Order::factory()->open()->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 50000])
            ->assertCreated();

        $this->assertDatabaseHas('driver_profiles', ['user_id' => $driver->id, 'credits' => 4]);
        $this->assertDatabaseHas('credit_transactions', [
            'driver_id' => $driver->id,
            'amount' => -1,
            'type' => 'bid_deduction',
        ]);
    }

    public function test_driver_with_zero_credits_cannot_bid(): void
    {
        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update(['credits' => 0]);
        $order = Order::factory()->open()->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 50000])
            ->assertUnprocessable()
            ->assertJsonFragment(['message' => 'Bạn không đủ credit để báo giá. Hãy nạp thêm credit.']);

        $this->assertDatabaseMissing('bids', ['order_id' => $order->id, 'driver_id' => $driver->id]);
    }

    public function test_no_credit_consumed_when_bid_fails(): void
    {
        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update(['credits' => 3]);
        $order = Order::factory()->cancelled()->create();

        $this->actingAs($driver)
            ->postJson("/api/orders/{$order->order_code}/bids", ['price' => 50000])
            ->assertUnprocessable();

        // credits unchanged
        $this->assertDatabaseHas('driver_profiles', ['user_id' => $driver->id, 'credits' => 3]);
    }

    // ── Credit balance endpoint ───────────────────────────────────────────────

    public function test_driver_can_view_credit_balance(): void
    {
        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update(['credits' => 7]);

        $this->actingAs($driver)
            ->getJson('/api/driver/credits')
            ->assertOk()
            ->assertJsonFragment(['credits' => 7, 'driver_id' => $driver->id]);
    }

    public function test_non_driver_cannot_view_credit_balance(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/driver/credits')
            ->assertForbidden();
    }

    public function test_credit_history_shows_transactions(): void
    {
        $driver = User::factory()->driver()->create();
        CreditTransaction::factory()->count(3)->create(['driver_id' => $driver->id]);

        $this->actingAs($driver)
            ->getJson('/api/driver/credits/history')
            ->assertOk()
            ->assertJsonPath('total', 3);
    }

    public function test_pending_topup_request_is_not_shown_as_credited_in_history(): void
    {
        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update(['credits' => 0]);

        $this->actingAs($driver)
            ->postJson('/api/driver/credits/request', ['amount' => 50])
            ->assertOk();

        // The pending request must NOT surface in the ledger (it isn't money yet),
        // so balance still reconciles with SUM(completed transactions) == 0.
        $this->actingAs($driver)
            ->getJson('/api/driver/credits/history')
            ->assertOk()
            ->assertJsonPath('total', 0);

        $this->assertDatabaseHas('driver_profiles', ['user_id' => $driver->id, 'credits' => 0]);
    }

    // ── Admin: bank settings ──────────────────────────────────────────────────

    public function test_admin_can_set_bank_settings(): void
    {
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->putJson('/api/admin/bank-settings', [
                'bank_id' => 'VCB',
                'account_number' => '1234567890',
                'account_name' => 'NGUYEN VAN A',
            ])
            ->assertOk()
            ->assertJsonFragment(['bank_id' => 'VCB', 'account_number' => '1234567890']);

        $this->assertDatabaseHas('bank_settings', ['bank_id' => 'VCB']);
    }

    public function test_admin_can_update_existing_bank_settings(): void
    {
        BankSetting::create(['bank_id' => 'VCB', 'account_number' => '111', 'account_name' => 'OLD']);
        $admin = User::factory()->admin()->create();

        $this->actingAs($admin)
            ->putJson('/api/admin/bank-settings', [
                'bank_id' => 'TCB',
                'account_number' => '999',
                'account_name' => 'NEW NAME',
            ])
            ->assertOk()
            ->assertJsonFragment(['bank_id' => 'TCB']);

        $this->assertDatabaseCount('bank_settings', 1);
    }

    public function test_non_admin_cannot_access_bank_settings(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->putJson('/api/admin/bank-settings', [
                'bank_id' => 'VCB',
                'account_number' => '123',
                'account_name' => 'A',
            ])
            ->assertForbidden();
    }

    public function test_bank_settings_returned_in_credit_balance(): void
    {
        BankSetting::create(['bank_id' => 'MB', 'account_number' => '55555', 'account_name' => 'CONG TY']);
        $driver = User::factory()->driver()->create();

        $this->actingAs($driver)
            ->getJson('/api/driver/credits')
            ->assertOk()
            ->assertJsonPath('bank_setting.bank_id', 'MB');
    }

    // ── Admin: add credits ────────────────────────────────────────────────────

    public function test_admin_approves_topup_request_by_reference_code(): void
    {
        $admin = User::factory()->admin()->create();
        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update(['credits' => 2]);

        // Driver requests a top-up first; this is what the admin approves.
        $code = $this->actingAs($driver)
            ->postJson('/api/driver/credits/request', ['amount' => 10])
            ->assertOk()
            ->json('reference_code');

        // Requesting must not credit anything yet (no phantom positive in the ledger).
        $this->assertDatabaseHas('driver_profiles', ['user_id' => $driver->id, 'credits' => 2]);

        $this->actingAs($admin)
            ->postJson('/api/admin/credits/add', ['reference_code' => $code])
            ->assertOk()
            ->assertJsonFragment(['credits' => 12]);

        $this->assertDatabaseHas('driver_profiles', ['user_id' => $driver->id, 'credits' => 12]);
        // The request row itself is transitioned to completed — no duplicate row.
        $this->assertDatabaseHas('credit_transactions', [
            'reference_code' => $code,
            'amount' => 10,
            'type' => 'topup',
            'status' => 'completed',
        ]);
        $this->assertEquals(1, CreditTransaction::where('reference_code', $code)->count());
    }

    public function test_admin_cannot_approve_same_topup_twice(): void
    {
        $admin = User::factory()->admin()->create();
        $driver = User::factory()->driver()->create();
        $driver->driverProfile->update(['credits' => 0]);

        $code = $this->actingAs($driver)
            ->postJson('/api/driver/credits/request', ['amount' => 20])
            ->json('reference_code');

        $this->actingAs($admin)->postJson('/api/admin/credits/add', ['reference_code' => $code])->assertOk();

        // Replaying the same approval must fail — no over-crediting.
        $this->actingAs($admin)
            ->postJson('/api/admin/credits/add', ['reference_code' => $code])
            ->assertUnprocessable();

        $this->assertDatabaseHas('driver_profiles', ['user_id' => $driver->id, 'credits' => 20]);
    }

    public function test_admin_can_list_pending_topup_requests(): void
    {
        $admin = User::factory()->admin()->create();
        $driver = User::factory()->driver()->create();

        $this->actingAs($driver)->postJson('/api/driver/credits/request', ['amount' => 5]);
        $this->actingAs($driver)->postJson('/api/driver/credits/request', ['amount' => 10]);

        $this->actingAs($admin)
            ->getJson('/api/admin/credits/requests')
            ->assertOk()
            ->assertJsonPath('total', 2);
    }

    public function test_non_admin_cannot_add_credits(): void
    {
        $user = User::factory()->create();
        $driver = User::factory()->driver()->create();

        $this->actingAs($user)
            ->postJson('/api/admin/credits/add', ['driver_id' => $driver->id, 'amount' => 5])
            ->assertForbidden();
    }

    public function test_admin_can_list_drivers_with_credits(): void
    {
        $admin = User::factory()->admin()->create();
        User::factory()->driver()->count(3)->create();

        $this->actingAs($admin)
            ->getJson('/api/admin/credits')
            ->assertOk()
            ->assertJsonPath('total', 3);
    }

    public function test_admin_can_view_all_credit_transactions(): void
    {
        $admin = User::factory()->admin()->create();
        $driver = User::factory()->driver()->create();
        CreditTransaction::factory()->count(5)->create(['driver_id' => $driver->id]);

        $this->actingAs($admin)
            ->getJson('/api/admin/credits/transactions')
            ->assertOk()
            ->assertJsonPath('total', 5);
    }
}
