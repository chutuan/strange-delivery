<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditTransaction;
use App\Models\DriverProfile;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function stats(): JsonResponse
    {
        $byStatus = Order::selectRaw('status, count(*) as c')->groupBy('status')->pluck('c', 'status');

        return response()->json([
            'users' => User::count(),
            'drivers' => DriverProfile::count(),
            'admins' => User::where('is_admin', true)->count(),
            'orders_total' => Order::count(),
            'orders_by_status' => [
                'draft' => (int) ($byStatus['draft'] ?? 0),
                'open' => (int) ($byStatus['open'] ?? 0),
                'in_progress' => (int) ($byStatus['in_progress'] ?? 0),
                'delivered' => (int) ($byStatus['delivered'] ?? 0),
                'cancelled' => (int) ($byStatus['cancelled'] ?? 0),
            ],
            'revenue' => (float) Order::where('status', 'delivered')->sum('final_price'),
            'pending_topups' => CreditTransaction::where('type', 'topup')->where('status', 'pending')->count(),
            'recent_orders' => Order::with('sender:id,name')
                ->latest()
                ->take(6)
                ->get(['id', 'order_code', 'title', 'status', 'budget_price', 'final_price', 'sender_id', 'created_at']),
        ]);
    }

    public function users(Request $request): JsonResponse
    {
        $role = $request->query('role'); // all | drivers | admins

        $query = User::query()
            ->withCount(['sentOrders', 'drivenOrders'])
            ->with('driverProfile:id,user_id,credits,rating_avg,rating_count,is_active')
            ->when($request->q, function ($q, $s) {
                $q->where(fn ($w) => $w->where('name', 'like', "%{$s}%")
                    ->orWhere('email', 'like', "%{$s}%")
                    ->orWhere('phone', 'like', "%{$s}%"));
            })
            ->when($role === 'drivers', fn ($q) => $q->whereHas('driverProfile'))
            ->when($role === 'admins', fn ($q) => $q->where('is_admin', true))
            ->latest();

        return response()->json($query->paginate(20)->withQueryString());
    }

    public function toggleAdmin(Request $request, User $user): JsonResponse
    {
        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'Không thể thay đổi quyền của chính bạn.'], 422);
        }

        $user->is_admin = ! $user->is_admin;
        $user->save();

        return response()->json(['id' => $user->id, 'is_admin' => $user->is_admin]);
    }

    public function orders(Request $request): JsonResponse
    {
        $query = Order::query()
            ->with(['sender:id,name', 'driver:id,name'])
            ->when($request->status, fn ($q, $s) => $q->where('status', $s))
            ->when($request->order_type, fn ($q, $t) => $q->where('order_type', $t))
            ->when($request->q, function ($q, $s) {
                $q->where(fn ($w) => $w->where('title', 'like', "%{$s}%")
                    ->orWhere('order_code', 'like', "%{$s}%")
                    ->orWhere('pickup_address', 'like', "%{$s}%")
                    ->orWhere('delivery_address', 'like', "%{$s}%"));
            })
            ->latest();

        return response()->json($query->paginate(20)->withQueryString());
    }

    public function orderShow(Order $order): JsonResponse
    {
        $order->load([
            'sender:id,name,phone,avatar',
            'driver:id,name,phone,avatar',
            'bids.driver:id,name,avatar',
            'bids.driver.driverProfile:user_id,vehicle_type,rating_avg,rating_count',
            'rating.sender:id,name,avatar', 'rating.driver:id,name,avatar',
        ]);

        // Admins get full oversight, including the otherwise-hidden recipient.
        $order->makeVisible(['recipient_name', 'recipient_phone']);

        return response()->json($order);
    }
}
