<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bid;
use App\Models\Order;
use App\Models\Rating;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    // Public trust profile of any driver — lets a sender vet a stranger before
    // handing over a package (core to the "anyone can be a driver" model).
    public function publicProfile(User $user): JsonResponse
    {
        $profile = $user->driverProfile;

        if (! $profile) {
            return response()->json(['message' => 'Người dùng này chưa phải tài xế.'], 404);
        }

        $totalDelivered = Order::where('driver_id', $user->id)
            ->where('status', 'delivered')
            ->count();

        $reviews = Rating::where('driver_id', $user->id)
            ->whereNotNull('score')
            ->with('sender:id,name,avatar')
            ->latest()
            ->limit(10)
            ->get(['id', 'sender_id', 'score', 'comment', 'created_at']);

        $c = Rating::where('driver_id', $user->id)
            ->selectRaw('AVG(score_punctuality) as punctuality, AVG(score_attitude) as attitude, AVG(score_care) as care')
            ->first();
        $avg = fn ($v) => $v !== null ? round((float) $v, 1) : null;

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'avatar' => $user->avatar,
            'member_since' => $user->created_at,
            'is_active' => (bool) $profile->is_active,
            'is_verified' => (bool) $profile->is_verified,
            'verified_at' => $profile->verified_at,
            'rating_avg' => (float) $profile->rating_avg,
            'rating_count' => (int) $profile->rating_count,
            'total_delivered' => $totalDelivered,
            'criteria' => [
                'punctuality' => $avg($c->punctuality),
                'attitude' => $avg($c->attitude),
                'care' => $avg($c->care),
            ],
            'vehicle_types' => $profile->vehicles()->pluck('vehicle_type')->unique()->values(),
            'reviews' => $reviews,
        ]);
    }

    public function register(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->driverProfile) {
            return response()->json(['message' => 'Bạn đã đăng ký tài xế rồi.'], 422);
        }

        $data = $request->validate([
            'vehicle_type'  => 'required|in:motorbike,car,truck',
            'license_plate' => 'required|string|max:20|unique:vehicles,license_plate',
        ]);

        $profile = $user->driverProfile()->create([]);

        $profile->vehicles()->create([
            'vehicle_type'  => $data['vehicle_type'],
            'license_plate' => $data['license_plate'],
            'is_primary'    => true,
        ]);

        return response()->json($profile->load('vehicles'), 201);
    }

    public function profile(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (! $profile) {
            return response()->json(['message' => 'Chưa đăng ký tài xế.'], 404);
        }

        return response()->json($profile->load('vehicles'));
    }

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->driverProfile) {
            return response()->json(['message' => 'Chưa đăng ký tài xế.'], 404);
        }

        $deliveredOrders = Order::where('driver_id', $user->id)->where('status', 'delivered');
        $totalDelivered  = (clone $deliveredOrders)->count();
        $totalEarnings   = (clone $deliveredOrders)->sum('final_price');

        $bids         = Bid::where('driver_id', $user->id);
        $totalBids    = (clone $bids)->count();
        $acceptedBids = (clone $bids)->where('status', 'accepted')->count();

        $activeOrders = Order::where('driver_id', $user->id)->where('status', 'in_progress')->count();

        $recentDeliveries = Order::where('driver_id', $user->id)
            ->where('status', 'delivered')
            ->with('sender:id,name,phone')
            ->latest('delivered_at')
            ->limit(5)
            ->get(['id', 'order_code', 'title', 'delivery_address', 'final_price', 'delivered_at', 'sender_id']);

        $dailyStats = Order::where('driver_id', $user->id)
            ->where('status', 'delivered')
            ->where('delivered_at', '>=', now()->subDays(29)->startOfDay())
            ->selectRaw('DATE(delivered_at) as date, COUNT(*) as orders, SUM(final_price) as earnings')
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $days = collect(range(0, 29))->map(function ($i) use ($dailyStats) {
            $date = now()->subDays(29 - $i)->format('Y-m-d');
            $row  = $dailyStats->get($date);
            return [
                'date'     => $date,
                'orders'   => $row ? (int) $row->orders : 0,
                'earnings' => $row ? (float) $row->earnings : 0,
            ];
        });

        return response()->json([
            'total_delivered'  => $totalDelivered,
            'total_earnings'   => (float) $totalEarnings,
            'active_orders'    => $activeOrders,
            'total_bids'       => $totalBids,
            'accepted_bids'    => $acceptedBids,
            'rating_avg'       => (float) $user->driverProfile->rating_avg,
            'rating_count'     => $user->driverProfile->rating_count,
            'recent_deliveries' => $recentDeliveries,
            'daily_stats'      => $days,
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (! $profile) {
            return response()->json(['message' => 'Chưa đăng ký tài xế.'], 404);
        }

        $data = $request->validate([
            'id_card_number' => 'nullable|string|max:20',
            'notification_radius_km' => 'sometimes|integer|min:1|max:20',
        ]);

        $profile->update($data);

        return response()->json($profile->load('vehicles'));
    }

    public function updateLocation(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (! $profile) {
            return response()->json(['message' => 'Chưa đăng ký tài xế.'], 404);
        }

        $data = $request->validate([
            'lat' => 'required|numeric|between:-90,90',
            'lng' => 'required|numeric|between:-180,180',
            'push_token' => 'nullable|string|max:255',
        ]);

        $profile->update([
            'current_lat' => $data['lat'],
            'current_lng' => $data['lng'],
            'push_token' => $data['push_token'] ?? $profile->push_token,
        ]);

        return response()->json(['ok' => true]);
    }

    public function toggleOnline(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (! $profile) {
            return response()->json(['message' => 'Chưa đăng ký tài xế.'], 404);
        }

        $profile->update(['is_active' => ! $profile->is_active]);

        return response()->json($profile);
    }

    public function orders(Request $request): JsonResponse
    {
        if (! $request->user()->driverProfile) {
            return response()->json(['message' => 'Chưa đăng ký tài xế.'], 404);
        }

        $filters = $request->validate([
            'status' => 'nullable|in:in_progress,delivered,cancelled',
        ]);

        $query = $request->user()
            ->drivenOrders()
            ->with('sender:id,name,phone,avatar')
            ->latest();

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return response()->json($query->paginate(15)->withQueryString());
    }
}
