<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bid;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function mySentOrders(Request $request): JsonResponse
    {
        $orders = $request->user()
            ->sentOrders()
            ->with(['driver:id,name,phone,avatar', 'bids'])
            ->latest()
            ->paginate(15);

        return response()->json($orders);
    }

    public function openOrders(Request $request): JsonResponse
    {
        if (! $request->user()->driverProfile) {
            return response()->json(['message' => 'Bạn cần đăng ký tài xế.'], 403);
        }

        $orders = Order::where('status', 'open')
            ->where('sender_id', '!=', $request->user()->id)
            ->with('sender:id,name,phone,avatar')
            ->latest()
            ->paginate(15);

        return response()->json($orders);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();
        $isSender = $order->sender_id === $user->id;
        $isDriver = $order->driver_id === $user->id;

        if (! $isSender && ! $isDriver && $order->status !== 'open') {
            return response()->json(['message' => 'Không có quyền xem đơn này.'], 403);
        }

        $order->load(['sender:id,name,phone,avatar', 'driver:id,name,phone,avatar', 'bids.driver:id,name,avatar', 'rating']);

        return response()->json($order);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'pickup_address' => 'required|string',
            'pickup_lat' => 'nullable|numeric',
            'pickup_lng' => 'nullable|numeric',
            'delivery_address' => 'required|string',
            'delivery_lat' => 'nullable|numeric',
            'delivery_lng' => 'nullable|numeric',
            'budget_price' => 'required|numeric|min:0',
            'note' => 'nullable|string',
        ]);

        $order = $request->user()->sentOrders()->create($data);

        return response()->json($order, 201);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        if ($order->sender_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền hủy đơn này.'], 403);
        }

        if ($order->status !== 'open') {
            return response()->json(['message' => 'Chỉ có thể hủy đơn đang mở.'], 422);
        }

        $order->update(['status' => 'cancelled']);

        return response()->json($order);
    }

    public function acceptBid(Request $request, Order $order, Bid $bid): JsonResponse
    {
        if ($order->sender_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền.'], 403);
        }

        if ($order->status !== 'open') {
            return response()->json(['message' => 'Đơn không còn ở trạng thái mở.'], 422);
        }

        if ($bid->order_id !== $order->id) {
            return response()->json(['message' => 'Bid không thuộc đơn này.'], 422);
        }

        $order->bids()->where('id', '!=', $bid->id)->update(['status' => 'rejected']);

        $bid->update(['status' => 'accepted']);
        $order->update([
            'status' => 'in_progress',
            'driver_id' => $bid->driver_id,
            'final_price' => $bid->price,
        ]);

        $order->load(['driver:id,name,phone,avatar', 'bids']);

        return response()->json($order);
    }

    public function deliver(Request $request, Order $order): JsonResponse
    {
        if ($order->driver_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền.'], 403);
        }

        if ($order->status !== 'in_progress') {
            return response()->json(['message' => 'Đơn chưa được nhận hoặc đã hoàn thành.'], 422);
        }

        $order->update([
            'status' => 'delivered',
            'delivered_at' => now(),
        ]);

        return response()->json($order);
    }
}
