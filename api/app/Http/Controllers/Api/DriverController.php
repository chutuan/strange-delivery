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
}
