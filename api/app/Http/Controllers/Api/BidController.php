<?php

namespace App\Http\Controllers\Api;

use App\Enums\BidStatus;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Bid;
use App\Models\CreditTransaction;
use App\Models\DriverProfile;
use App\Models\Notification;
use App\Models\Order;
use Illuminate\Database\QueryException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BidController extends Controller
{
    public function myBids(Request $request): JsonResponse
    {
        $status = $request->query('status');

        $query = $request->user()
            ->bids()
            ->with(['order:id,title,pickup_address,delivery_address,status,budget_price,final_price,sender_id,created_at'])
            ->latest();

        if ($status && in_array($status, ['pending', 'accepted', 'rejected'])) {
            $query->where('status', $status);
        }

        $bids = $query->paginate(15);

        return response()->json($bids);
    }

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

        if ($order->order_type === 'instant') {
            return response()->json(['message' => 'Đơn giao luôn không nhận báo giá.'], 422);
        }

        // Quick pre-check before entering the transaction
        if ($user->driverProfile->credits < 1) {
            return response()->json(['message' => 'Bạn không đủ credit để báo giá. Hãy nạp thêm credit.'], 422);
        }

        $data = $request->validate([
            'price' => 'required|numeric|min:0',
            'note' => 'nullable|string',
        ]);

        try {
            $bid = DB::transaction(function () use ($order, $user, $data) {
                // Exclusive lock serializes concurrent bid submissions for the same order
                $fresh = Order::lockForUpdate()->findOrFail($order->id);

                if ($fresh->status !== OrderStatus::Open) {
                    throw new \RuntimeException('not_open');
                }

                if ($fresh->bids()->where('driver_id', $user->id)->exists()) {
                    throw new \RuntimeException('already_bid');
                }

                // Lock driver profile to prevent two concurrent bids both seeing credits >= 1
                $profile = DriverProfile::lockForUpdate()->where('user_id', $user->id)->firstOrFail();
                if ($profile->credits < 1) {
                    throw new \RuntimeException('insufficient_credits');
                }

                $bid = $fresh->bids()->create([
                    'driver_id' => $user->id,
                    'price' => $data['price'],
                    'note' => $data['note'] ?? null,
                ]);

                $profile->decrement('credits');

                CreditTransaction::create([
                    'driver_id' => $user->id,
                    'amount' => -1,
                    'type' => 'bid_deduction',
                    'description' => "Báo giá đơn #{$fresh->id}",
                    'bid_id' => $bid->id,
                ]);

                return $bid;
            });
        } catch (QueryException) {
            // Unique constraint (order_id, driver_id) as last-resort safety net
            return response()->json(['message' => 'Bạn đã bid đơn này rồi.'], 422);
        } catch (\RuntimeException $e) {
            return match ($e->getMessage()) {
                'not_open' => response()->json(['message' => 'Đơn không còn nhận bid.'], 422),
                'already_bid' => response()->json(['message' => 'Bạn đã bid đơn này rồi.'], 422),
                'insufficient_credits' => response()->json(['message' => 'Bạn không đủ credit để báo giá. Hãy nạp thêm credit.'], 422),
                default => throw $e,
            };
        }

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
