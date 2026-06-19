<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
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

        if ($order->sender_id === $user->id) {
            return response()->json(['message' => 'Không thể bid đơn của chính mình.'], 422);
        }

        if ($order->status !== 'open') {
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

        return response()->json($bid, 201);
    }
}
