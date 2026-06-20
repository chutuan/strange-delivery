<?php

namespace App\Http\Controllers\Api;

use App\Enums\BidStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Bid;
use App\Models\Notification;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BidController extends Controller
{
    public function index(Order $order): JsonResponse
    {
        $bids = $order->bids()->with('driver:id,name,avatar,phone')->latest()->get();

        return response()->json($bids);
    }

    public function store(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if (! $user->driverProfile) {
            return response()->json(['message' => 'Bạn cần đăng ký tài xế để bid.'], 403);
        }

        if (! $user->driverProfile->is_active) {
            return response()->json(['message' => 'Bạn đang offline. Bật online để có thể báo giá.'], 422);
        }

        if ($order->sender_id === $user->id) {
            return response()->json(['message' => 'Không thể bid đơn của chính mình.'], 422);
        }

        if ($order->status !== OrderStatus::Open) {
            return response()->json(['message' => 'Đơn không còn nhận bid.'], 422);
        }

        if ($order->bids()->where('driver_id', $user->id)->exists()) {
            return response()->json(['message' => 'Bạn đã bid đơn này rồi.'], 422);
        }

        $data = $request->validate([
            'price' => 'required|numeric|min:0',
            'note' => 'nullable|string',
        ]);

        $bid = $order->bids()->create([
            'driver_id' => $user->id,
            'price' => $data['price'],
            'note' => $data['note'] ?? null,
        ]);

        $bid->load('driver:id,name,avatar,phone');

        Notification::notify(
            $order->sender_id,
            'bid_placed',
            'Có báo giá mới',
            "{$user->name} đã báo giá cho đơn \"{$order->title}\".",
            $order->id,
        );

        return response()->json($bid, 201);
    }

    public function destroy(Request $request, Order $order, Bid $bid): JsonResponse
    {
        $user = $request->user();

        if ($bid->order_id !== $order->id) {
            return response()->json(['message' => 'Báo giá không thuộc đơn này.'], 422);
        }

        if ($bid->driver_id !== $user->id) {
            return response()->json(['message' => 'Không có quyền.'], 403);
        }

        if ($bid->status !== BidStatus::Pending) {
            return response()->json(['message' => 'Chỉ có thể rút báo giá đang chờ.'], 422);
        }

        $bid->delete();

        return response()->json(['message' => 'Đã rút báo giá.']);
    }
}
