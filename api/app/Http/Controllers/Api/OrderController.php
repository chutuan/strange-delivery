<?php

namespace App\Http\Controllers\Api;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Bid;
use App\Models\DriverProfile;
use App\Models\Notification;
use App\Models\Order;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

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
        $query = $request->user()
            ->sentOrders()
            ->with(['driver:id,name,phone,avatar', 'bids'])
            ->latest();

        $counts = $request->user()
            ->sentOrders()
            ->selectRaw('status, count(*) as total')
            ->groupBy('status')
            ->pluck('total', 'status');

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $orders = $query->paginate(15);

        return response()->json(array_merge($orders->toArray(), [
            'counts' => $counts,
        ]));
    }

    public function openOrders(Request $request): JsonResponse
    {
        if (! $request->user()->driverProfile) {
            return response()->json(['message' => 'Bạn cần đăng ký tài xế.'], 403);
        }

        $hasActiveInstant = Order::where('driver_id', $request->user()->id)
            ->where('order_type', 'instant')
            ->where('status', 'in_progress')
            ->exists();

        $filters = $request->validate([
            'q' => 'nullable|string|max:255',
            'min_price' => 'nullable|numeric|min:0',
            'max_price' => 'nullable|numeric|min:0',
            'sort' => 'nullable|in:newest,price_asc,price_desc,nearest',
            'lat' => 'nullable|numeric|between:-90,90',
            'lng' => 'nullable|numeric|between:-180,180',
        ]);

        $lat = isset($filters['lat']) ? (float) $filters['lat'] : null;
        $lng = isset($filters['lng']) ? (float) $filters['lng'] : null;
        $sortNearest = ($filters['sort'] ?? '') === 'nearest';

        $query = Order::where('status', OrderStatus::Open)
            ->where('sender_id', '!=', $request->user()->id)
            ->when($hasActiveInstant, fn ($q) => $q->where('order_type', '!=', 'instant'))
            ->with('sender:id,name,phone,avatar,sender_rating_avg,sender_rating_count');

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

        if (! $sortNearest) {
            match ($filters['sort'] ?? 'newest') {
                'price_asc' => $query->orderBy('budget_price'),
                'price_desc' => $query->orderByDesc('budget_price'),
                default => $query->latest(),
            };
        } else {
            $query->latest();
        }

        $paginated = $query->paginate(15)->withQueryString();

        // Attach sender stats (completed orders count) in one extra query
        $senderIds = $paginated->getCollection()->pluck('sender_id')->unique()->filter();
        $completedCounts = Order::whereIn('sender_id', $senderIds)
            ->where('status', OrderStatus::Delivered)
            ->groupBy('sender_id')
            ->selectRaw('sender_id, COUNT(*) as count')
            ->pluck('count', 'sender_id');

        $paginated->getCollection()->transform(function (Order $order) use ($lat, $lng, $completedCounts) {
            if ($order->sender) {
                $order->sender->completed_orders = (int) ($completedCounts[$order->sender_id] ?? 0);
            }
            if ($lat !== null && $lng !== null) {
                $order->distance_km = ($order->pickup_lat && $order->pickup_lng)
                    ? $this->haversine($lat, $lng, $order->pickup_lat, $order->pickup_lng)
                    : null;
            }
            return $order;
        });

        if ($lat !== null && $lng !== null && $sortNearest) {
            $sorted = $paginated->getCollection()
                ->sortBy(fn ($o) => $o->distance_km ?? PHP_INT_MAX)
                ->values();
            $paginated->setCollection($sorted);
        }

        return response()->json($paginated);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();
        $isSender = $order->sender_id === $user->id;
        $isDriver = $order->driver_id === $user->id;

        if (! $isSender && ! $isDriver && $order->status !== OrderStatus::Open) {
            return response()->json(['message' => 'Không có quyền xem đơn này.'], 403);
        }

        $order->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating.sender:id,name,avatar', 'rating.driver:id,name,avatar',
        ]);

        return response()->json($order);
    }

    public function recipient(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        $isSender = $order->sender_id === $user->id;
        $isAssignedDriver = $order->driver_id === $user->id
            && in_array($order->status->value, ['in_progress', 'delivered']);

        if (! $isSender && ! $isAssignedDriver) {
            return response()->json(['message' => 'Không có quyền xem thông tin người nhận.'], 403);
        }

        return response()->json([
            'recipient_name'  => $order->recipient_name,
            'recipient_phone' => $order->recipient_phone,
        ]);
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
            'recipient_name'  => 'required|string|max:255',
            'recipient_phone' => 'required|string|max:20',
            'budget_price'    => 'required|numeric|min:0',
            'vehicle_type'    => 'nullable|in:motorbike,car,truck',
            'order_type'      => 'nullable|in:instant,bidding',
            'note'            => 'nullable|string',
            'pickup_time'     => 'nullable|date',
            'required_before' => 'nullable|date',
            'publish'         => 'nullable|boolean',
        ]);

        $publish = (bool) ($data['publish'] ?? false);
        unset($data['publish']);

        if ($publish) {
            $data['status'] = OrderStatus::Open;
        }

        $order = $request->user()->sentOrders()->create($data);

        if ($publish) {
            $this->notifyNearbyDrivers($order);
        }

        return response()->json($order, 201);
    }

    public function publish(Request $request, Order $order): JsonResponse
    {
        if ($order->sender_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền.'], 403);
        }

        if ($order->status !== OrderStatus::Draft) {
            return response()->json(['message' => 'Chỉ có thể đăng đơn nháp.'], 422);
        }

        $order->update(['status' => OrderStatus::Open]);

        $this->notifyNearbyDrivers($order);

        $order->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating.sender:id,name,avatar', 'rating.driver:id,name,avatar',
        ]);

        return response()->json($order);
    }

    public function cancel(Request $request, Order $order): JsonResponse
    {
        if ($order->sender_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền hủy đơn này.'], 403);
        }

        try {
            DB::transaction(function () use ($order) {
                $fresh = Order::lockForUpdate()->findOrFail($order->id);

                if (! in_array($fresh->status, [OrderStatus::Open, OrderStatus::Draft])) {
                    throw new \RuntimeException('not_cancellable');
                }

                $bidderIds = $fresh->status === OrderStatus::Open
                    ? $fresh->bids()->where('status', 'pending')->pluck('driver_id')
                    : collect();

                $fresh->update(['status' => OrderStatus::Cancelled]);

                foreach ($bidderIds as $driverId) {
                    Notification::notify(
                        $driverId,
                        'order_cancelled',
                        'Đơn đã bị hủy',
                        "Đơn \"{$fresh->title}\" bạn đã báo giá vừa bị người gửi hủy.",
                        $fresh->id,
                    );
                }
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'not_cancellable') {
                return response()->json(['message' => 'Chỉ có thể hủy đơn đang mở hoặc chưa đăng.'], 422);
            }
            throw $e;
        }

        $order->refresh()->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating.sender:id,name,avatar', 'rating.driver:id,name,avatar',
        ]);

        return response()->json($order);
    }

    public function acceptBid(Request $request, Order $order, Bid $bid): JsonResponse
    {
        if ($order->sender_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền.'], 403);
        }

        if ($bid->order_id !== $order->id) {
            return response()->json(['message' => 'Bid không thuộc đơn này.'], 422);
        }

        try {
            DB::transaction(function () use ($order, $bid) {
                // Exclusive lock prevents two concurrent accept calls from both seeing status=open
                $fresh = Order::lockForUpdate()->findOrFail($order->id);

                if ($fresh->status !== OrderStatus::Open) {
                    throw new \RuntimeException('not_open');
                }

                $rejectedDriverIds = $fresh->bids()
                    ->where('id', '!=', $bid->id)
                    ->where('status', 'pending')
                    ->pluck('driver_id');

                $fresh->bids()->where('id', '!=', $bid->id)->update(['status' => 'rejected']);
                $bid->update(['status' => 'accepted']);
                $fresh->update([
                    'status' => OrderStatus::InProgress,
                    'driver_id' => $bid->driver_id,
                    'final_price' => $bid->price,
                    'accepted_at' => now(),
                ]);

                Notification::notify(
                    $bid->driver_id,
                    'bid_accepted',
                    'Báo giá được chọn',
                    "Báo giá của bạn cho đơn \"{$fresh->title}\" đã được chọn.",
                    $fresh->id,
                );

                foreach ($rejectedDriverIds as $driverId) {
                    Notification::notify(
                        $driverId,
                        'bid_rejected',
                        'Báo giá không được chọn',
                        "Đơn \"{$fresh->title}\" đã chọn một tài xế khác.",
                        $fresh->id,
                    );
                }
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'not_open') {
                return response()->json(['message' => 'Đơn không còn ở trạng thái mở.'], 422);
            }
            throw $e;
        }

        $order->refresh()->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating.sender:id,name,avatar', 'rating.driver:id,name,avatar',
        ]);

        return response()->json($order);
    }

    public function acceptInstant(Request $request, Order $order): JsonResponse
    {
        $user = $request->user();

        if ($order->order_type !== 'instant') {
            return response()->json(['message' => 'Đơn này không phải loại giao luôn.'], 422);
        }

        if ($order->status !== OrderStatus::Open) {
            return response()->json(['message' => 'Đơn này không còn mở.'], 422);
        }

        if ($order->sender_id === $user->id) {
            return response()->json(['message' => 'Không thể tự nhận đơn của mình.'], 422);
        }

        if (! $user->driverProfile) {
            return response()->json(['message' => 'Bạn chưa đăng ký tài xế.'], 403);
        }

        $hasActive = Order::where('driver_id', $user->id)
            ->where('order_type', 'instant')
            ->where('status', 'in_progress')
            ->exists();

        if ($hasActive) {
            return response()->json(['message' => 'Bạn đang có đơn giao luôn chưa hoàn thành.'], 422);
        }

        $order->update([
            'driver_id'   => $user->id,
            'final_price' => $order->budget_price,
            'status'      => 'in_progress',
        ]);

        $order->load(['sender:id,name,phone,avatar', 'driver:id,name,phone,avatar', 'bids.driver:id,name,avatar', 'rating.sender:id,name,avatar']);

        return response()->json($order);
    }

    public function deliver(Request $request, Order $order): JsonResponse
    {
        if ($order->driver_id !== $request->user()->id) {
            return response()->json(['message' => 'Không có quyền.'], 403);
        }

        $data = $request->validate([
            'delivery_note' => 'nullable|string|max:1000',
        ]);

        try {
            DB::transaction(function () use ($order, $data) {
                $fresh = Order::lockForUpdate()->findOrFail($order->id);

                if ($fresh->status !== OrderStatus::InProgress) {
                    throw new \RuntimeException('not_in_progress');
                }

                $fresh->update([
                    'status' => OrderStatus::Delivered,
                    'delivered_at' => now(),
                    'delivery_note' => $data['delivery_note'] ?? null,
                ]);

                Notification::notify(
                    $fresh->sender_id,
                    'order_delivered',
                    'Đơn đã được giao',
                    "Đơn \"{$fresh->title}\" đã được giao. Hãy đánh giá tài xế.",
                    $fresh->id,
                );
            });
        } catch (\RuntimeException $e) {
            if ($e->getMessage() === 'not_in_progress') {
                return response()->json(['message' => 'Đơn chưa được nhận hoặc đã hoàn thành.'], 422);
            }
            throw $e;
        }

        $order->refresh()->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating.sender:id,name,avatar', 'rating.driver:id,name,avatar',
        ]);

        return response()->json($order);
    }

    private function haversine(float $lat1, float $lng1, float $lat2, float $lng2): float
    {
        $R = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2
            + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;

        return round($R * 2 * atan2(sqrt($a), sqrt(1 - $a)), 2);
    }

    private function notifyNearbyDrivers(Order $order): void
    {
        if (! $order->pickup_lat || ! $order->pickup_lng) {
            return;
        }

        $drivers = DriverProfile::with('user')
            ->where('is_active', true)
            ->whereNotNull('current_lat')
            ->whereNotNull('current_lng')
            ->get();

        $pushMessages = [];

        foreach ($drivers as $profile) {
            $distance = $this->haversine(
                $profile->current_lat, $profile->current_lng,
                $order->pickup_lat, $order->pickup_lng,
            );

            if ($distance > $profile->notification_radius_km) {
                continue;
            }

            Notification::notify(
                $profile->user_id,
                'new_order_nearby',
                'Có đơn hàng mới gần bạn!',
                "Đơn \"{$order->title}\" cách bạn ".round($distance, 1).'km',
                $order->id,
            );

            if ($profile->push_token) {
                $pushMessages[] = [
                    'to' => $profile->push_token,
                    'title' => 'Có đơn hàng mới gần bạn! 🚀',
                    'body' => "Đơn \"{$order->title}\" cách bạn ".round($distance, 1).'km',
                    'data' => ['order_id' => $order->id, 'type' => 'new_order_nearby'],
                    'sound' => 'default',
                ];
            }
        }

        if (! empty($pushMessages)) {
            try {
                Http::timeout(5)->post('https://exp.host/push/send', $pushMessages);
            } catch (\Throwable) {
                // Push delivery is best-effort; don't fail the request
            }
        }
    }
}
