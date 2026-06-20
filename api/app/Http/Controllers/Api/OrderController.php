<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bid;
use App\Models\Notification;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function track(Order $order): JsonResponse
    {
        $order->load([
            'driver:id,name',
            'driver.driverProfile:user_id,vehicle_type,license_plate,rating_avg,rating_count',
        ]);

        return response()->json([
            'id' => $order->id,
            'title' => $order->title,
            'status' => $order->status,
            'pickup_address' => $order->pickup_address,
            'delivery_address' => $order->delivery_address,
            'required_before' => $order->required_before,
            'created_at' => $order->created_at,
            'accepted_at' => $order->accepted_at,
            'delivered_at' => $order->delivered_at,
            'delivery_note' => $order->delivery_note,
            'driver' => $order->driver ? [
                'name' => $order->driver->name,
                'vehicle_type' => $order->driver->driverProfile?->vehicle_type,
                'license_plate' => $order->driver->driverProfile?->license_plate,
                'rating_avg' => $order->driver->driverProfile?->rating_avg ?? 0,
                'rating_count' => $order->driver->driverProfile?->rating_count ?? 0,
            ] : null,
        ]);
    }

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

        $filters = $request->validate([
            'q' => 'nullable|string|max:255',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
            'sort' => 'nullable|in:newest,price_asc,price_desc',
        ]);

        $query = Order::where('status', 'open')
            ->where('sender_id', '!=', $request->user()->id)
            ->with('sender:id,name,phone,avatar');

        if (! empty($filters['q'])) {
            $term = '%'.$filters['q'].'%';
            $query->where(function ($q) use ($term) {
                $q->where('title', 'like', $term)
                    ->orWhere('description', 'like', $term)
                    ->orWhere('pickup_address', 'like', $term)
                    ->orWhere('delivery_address', 'like', $term);
            });
        }

        if (isset($filters['min_price'])) {
            $query->where('budget_price', '>=', $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where('budget_price', '<=', $filters['max_price']);
        }

        match ($filters['sort'] ?? 'newest') {
            'price_asc' => $query->orderBy('budget_price'),
            'price_desc' => $query->orderByDesc('budget_price'),
            default => $query->latest(),
        };

        $orders = $query->paginate(15)->withQueryString();

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

        $order->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating',
        ]);

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
            'pickup_time' => 'nullable|date',
            'required_before' => 'nullable|date',
            'publish' => 'nullable|boolean',
        ]);

        $publish = (bool) ($data['publish'] ?? false);
        unset($data['publish']);

        if ($publish) {
            $data['status'] = 'open';
        }

        $order = $request->user()->sentOrders()->create($data);

        return response()->json($order, 201);
    }

    public function publish(Request $request, Order $order): JsonResponse
    {
        if ($order->sender_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền.'], 403);
        }

        if ($order->status !== 'draft') {
            return response()->json(['message' => 'Chỉ có thể đăng đơn nháp.'], 422);
        }

        $order->update(['status' => 'open']);

        $order->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating',
        ]);

        return response()->json($order);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        if ($order->sender_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền hủy đơn này.'], 403);
        }

        if (! in_array($order->status, ['open', 'draft'])) {
            return response()->json(['message' => 'Chỉ có thể hủy đơn đang mở hoặc chưa đăng.'], 422);
        }

        $bidderIds = $order->status === 'open'
            ? $order->bids()->where('status', 'pending')->pluck('driver_id')
            : collect();

        $order->update(['status' => 'cancelled']);

        foreach ($bidderIds as $driverId) {
            Notification::notify(
                $driverId,
                'order_cancelled',
                'Đơn đã bị hủy',
                "Đơn \"{$order->title}\" bạn đã báo giá vừa bị người gửi hủy.",
                $order->id,
            );
        }

        $order->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating',
        ]);

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

        $rejectedDriverIds = $order->bids()
            ->where('id', '!=', $bid->id)
            ->where('status', 'pending')
            ->pluck('driver_id');

        $order->bids()->where('id', '!=', $bid->id)->update(['status' => 'rejected']);

        $bid->update(['status' => 'accepted']);
        $order->update([
            'status' => 'in_progress',
            'driver_id' => $bid->driver_id,
            'final_price' => $bid->price,
            'accepted_at' => now(),
        ]);

        Notification::notify(
            $bid->driver_id,
            'bid_accepted',
            'Báo giá được chọn',
            "Báo giá của bạn cho đơn \"{$order->title}\" đã được chọn.",
            $order->id,
        );

        foreach ($rejectedDriverIds as $driverId) {
            Notification::notify(
                $driverId,
                'bid_rejected',
                'Báo giá không được chọn',
                "Đơn \"{$order->title}\" đã chọn một tài xế khác.",
                $order->id,
            );
        }

        $order->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating',
        ]);

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

        $data = $request->validate([
            'delivery_note' => 'nullable|string|max:1000',
        ]);

        $order->update([
            'status' => 'delivered',
            'delivered_at' => now(),
            'delivery_note' => $data['delivery_note'] ?? null,
        ]);

        Notification::notify(
            $order->sender_id,
            'order_delivered',
            'Đơn đã được giao',
            "Đơn \"{$order->title}\" đã được giao. Hãy đánh giá tài xế.",
            $order->id,
        );

        $order->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating',
        ]);

        return response()->json($order);
    }
}
