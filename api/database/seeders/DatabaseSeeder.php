<?php

namespace Database\Seeders;

use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // Tài xế cố định dùng để test
        $driver = User::factory()->driver()->create([
            'name'  => 'Tài xế Test',
            'email' => 'driver@example.com',
            'password' => Hash::make('123456'),
        ]);

        // 4 người gửi, mỗi người 3–5 đơn
        $senders = [
            ['name' => 'Nguyễn Văn An',   'email' => 'an@example.com'],
            ['name' => 'Trần Thị Bích',   'email' => 'bich@example.com'],
            ['name' => 'Lê Minh Cường',   'email' => 'cuong@example.com'],
            ['name' => 'Phạm Thu Hà',     'email' => 'ha@example.com'],
        ];

        foreach ($senders as $info) {
            $sender = User::factory()->create([
                'name'     => $info['name'],
                'email'    => $info['email'],
                'password' => Hash::make('123456'),
            ]);

            // 2 đơn open
            Order::factory(2)->open()->create(['sender_id' => $sender->id]);

            // 1 đơn đang giao
            Order::factory()->inProgress($driver)->create(['sender_id' => $sender->id]);

            // 1 đơn đã giao
            Order::factory()->delivered($driver)->create(['sender_id' => $sender->id]);
        }
    }
}
