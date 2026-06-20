<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RatingController extends Controller
{
    public function store(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if ($order->sender_id !== $user->id) {
            return response()->json(['message' => 'Chỉ người gửi mới được đánh giá.'], 403);
        }

        if ($order->status !== 'delivered') {
            return response()->json(['message' => 'Đơn chưa được giao.'], 422);
        }

        if ($order->rating) {
            return response()->json(['message' => 'Đơn này đã được đánh giá.'], 422);
        }

        $data = $request->validate([
            'score' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        $rating = $order->rating()->create([
            'sender_id' => $user->id,
            'driver_id' => $order->driver_id,
            'score' => $data['score'],
            'comment' => $data['comment'] ?? null,
        ]);

        $driverProfile = $order->driver->driverProfile;
        $newCount = $driverProfile->rating_count + 1;
        $newAvg = (($driverProfile->rating_avg * $driverProfile->rating_count) + $data['score']) / $newCount;

        $driverProfile->update([
            'rating_count' => $newCount,
            'rating_avg' => round($newAvg, 2),
        ]);

        Notification::notify(
            $order->driver_id,
            'rating_received',
            'Bạn nhận được đánh giá mới',
            "Bạn được đánh giá {$data['score']} sao cho đơn \"{$order->title}\".",
            $order->id,
        );

        return response()->json($rating, 201);
    }
}
