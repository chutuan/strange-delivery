<?php

namespace Tests\Unit;

use App\Support\DriverLevel;
use Tests\TestCase;

class DriverLevelTest extends TestCase
{
    public function test_tiers_by_delivery_count(): void
    {
        $this->assertSame('new', DriverLevel::for(0)['key']);
        $this->assertSame('new', DriverLevel::for(4)['key']);
        $this->assertSame('bronze', DriverLevel::for(5)['key']);
        $this->assertSame('bronze', DriverLevel::for(19)['key']);
        $this->assertSame('silver', DriverLevel::for(20)['key']);
        $this->assertSame('gold', DriverLevel::for(50)['key']);
        $this->assertSame('gold', DriverLevel::for(999)['key']);
    }

    public function test_next_tier_info(): void
    {
        $new = DriverLevel::for(0);
        $this->assertSame('Đồng', $new['next_label']);
        $this->assertSame(5, $new['next_at']);

        $gold = DriverLevel::for(60);
        $this->assertNull($gold['next_at']);
        $this->assertNull($gold['next_label']);
    }
}
