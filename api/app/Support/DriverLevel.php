<?php

namespace App\Support;

class DriverLevel
{
    // Tiers by completed deliveries, highest first.
    private const TIERS = [
        ['key' => 'gold',   'label' => 'Vàng', 'min' => 50],
        ['key' => 'silver', 'label' => 'Bạc',  'min' => 20],
        ['key' => 'bronze', 'label' => 'Đồng', 'min' => 5],
        ['key' => 'new',    'label' => 'Mới',  'min' => 0],
    ];

    public static function for(int $delivered): array
    {
        foreach (self::TIERS as $i => $tier) {
            if ($delivered >= $tier['min']) {
                $higher = self::TIERS[$i - 1] ?? null; // the next tier up (array is descending)

                return [
                    'key' => $tier['key'],
                    'label' => $tier['label'],
                    'min' => $tier['min'],
                    'next_label' => $higher['label'] ?? null,
                    'next_at' => $higher['min'] ?? null,
                ];
            }
        }

        // Unreachable (min 0 always matches), but keep a sane default.
        return ['key' => 'new', 'label' => 'Mới', 'min' => 0, 'next_label' => 'Đồng', 'next_at' => 5];
    }
}
