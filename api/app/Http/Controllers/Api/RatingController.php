<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Notification;
use App\Models\Order;
use App\Models\Rating;
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

        if ($order->status !== OrderStatus::Delivered) {
            return response()->json(['message' => 'Đơn chưa được giao.'], 422);
        }

        // The driver may have already rated the sender first (row exists with only
        // driver_score set). Guard on `score` specifically, not on the row existing.
        if ($order->rating?->score !== null) {
            return response()->json(['message' => 'Đơn này đã được đánh giá.'], 422);
        }

        $data = $request->validate([
            'score' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        if ($order->rating) {
            $order->rating->update([
                'score' => $data['score'],
                'comment' => $data['comment'] ?? null,
            ]);
            $rating = $order->rating;
        } else {
            $rating = $order->rating()->create([
                'sender_id' => $user->id,
                'driver_id' => $order->driver_id,
                'score' => $data['score'],
                'comment' => $data['comment'] ?? null,
            ]);
        }

        $aggregate = Rating::where('driver_id', $order->driver_id)
            ->whereNotNull('score')
            ->selectRaw('COUNT(*) as count, AVG(score) as avg')
            ->first();

        $order->driver?->driverProfile?->update([
            'rating_count' => $aggregate->count,
            'rating_avg' => round((float) $aggregate->avg, 2),
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

    public function rateSender(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if ($order->driver_id !== $user->id) {
            return response()->json(['message' => 'Chỉ tài xế của đơn mới có thể đánh giá người gửi.'], 403);
        }

        if ($order->status !== OrderStatus::Delivered) {
            return response()->json(['message' => 'Đơn chưa được giao.'], 422);
        }

        if ($order->rating?->driver_score !== null) {
            return response()->json(['message' => 'Bạn đã đánh giá người gửi rồi.'], 422);
        }

        $data = $request->validate([
            'score' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:500',
        ]);

        if ($order->rating) {
            $order->rating->update([
                'driver_score' => $data['score'],
                'driver_comment' => $data['comment'] ?? null,
            ]);
        } else {
            $order->rating()->create([
                'sender_id' => $order->sender_id,
                'driver_id' => $user->id,
                'driver_score' => $data['score'],
                'driver_comment' => $data['comment'] ?? null,
            ]);
        }

        $aggregate = Rating::where('sender_id', $order->sender_id)
            ->whereNotNull('driver_score')
            ->selectRaw('COUNT(*) as count, AVG(driver_score) as avg')
            ->first();

        $order->sender?->update([
            'sender_rating_count' => $aggregate->count,
            'sender_rating_avg' => round((float) $aggregate->avg, 2),
        ]);

        return response()->json($order->load('rating.sender:id,name,avatar'));
    }
}
