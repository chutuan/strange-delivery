<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DriverController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->driverProfile) {
            return response()->json(['message' => 'Bạn đã đăng ký tài xế rồi.'], 422);
        }

        $data = $request->validate([
            'vehicle_type' => 'required|in:motorbike,car,truck',
            'license_plate' => 'required|string|max:20',
            'id_card_number' => 'nullable|string|max:20',
        ]);

        $profile = $user->driverProfile()->create($data);

        return response()->json($profile, 201);
    }

    public function profile(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (! $profile) {
            return response()->json(['message' => 'Chưa đăng ký tài xế.'], 404);
        }

        return response()->json($profile);
    }

    public function update(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (! $profile) {
            return response()->json(['message' => 'Chưa đăng ký tài xế.'], 404);
        }

        $data = $request->validate([
            'vehicle_type' => 'sometimes|in:motorbike,car,truck',
            'license_plate' => 'sometimes|string|max:20',
            'id_card_number' => 'nullable|string|max:20',
        ]);

        $profile->update($data);

        return response()->json($profile);
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

    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->driverProfile) {
            return response()->json(['message' => 'Chưa đăng ký tài xế.'], 404);
        }

        $driven = $user->drivenOrders();

        return response()->json([
            'total_earnings' => (float) (clone $driven)->where('status', 'delivered')->sum('final_price'),
            'completed_count' => (clone $driven)->where('status', 'delivered')->count(),
            'in_progress_count' => (clone $driven)->where('status', 'in_progress')->count(),
            'rating_avg' => (float) $user->driverProfile->rating_avg,
            'rating_count' => (int) $user->driverProfile->rating_count,
        ]);
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
