<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VehicleController extends Controller
{
    private function profile(Request $request): ?\App\Models\DriverProfile
    {
        return $request->user()->driverProfile;
    }

    private function notDriver(): JsonResponse
    {
        return response()->json(['message' => 'Chưa đăng ký tài xế.'], 404);
    }

    private function notOwned(): JsonResponse
    {
        return response()->json(['message' => 'Không tìm thấy phương tiện.'], 404);
    }

    public function index(Request $request): JsonResponse
    {
        $profile = $this->profile($request);
        if (! $profile) return $this->notDriver();

        return response()->json($profile->vehicles);
    }

    public function store(Request $request): JsonResponse
    {
        $profile = $this->profile($request);
        if (! $profile) return $this->notDriver();

        $data = $request->validate([
            'vehicle_type'  => 'required|in:motorbike,car,truck',
            'license_plate' => 'required|string|max:20|unique:vehicles,license_plate',
            'is_primary'    => 'boolean',
        ]);

        if (! empty($data['is_primary'])) {
            $profile->vehicles()->update(['is_primary' => false]);
        }

        $vehicle = $profile->vehicles()->create($data);

        return response()->json($vehicle, 201);
    }

    public function update(Request $request, Vehicle $vehicle): JsonResponse
    {
        $profile = $this->profile($request);
        if (! $profile || $vehicle->driver_profile_id !== $profile->id) {
            return $this->notOwned();
        }

        $data = $request->validate([
            'vehicle_type'  => 'sometimes|in:motorbike,car,truck',
            'license_plate' => "sometimes|string|max:20|unique:vehicles,license_plate,{$vehicle->id}",
        ]);

        $vehicle->update($data);

        return response()->json($vehicle);
    }

    public function destroy(Request $request, Vehicle $vehicle): JsonResponse
    {
        $profile = $this->profile($request);
        if (! $profile || $vehicle->driver_profile_id !== $profile->id) {
            return $this->notOwned();
        }

        if ($profile->vehicles()->count() <= 1) {
            return response()->json(['message' => 'Phải có ít nhất 1 phương tiện.'], 422);
        }

        $wasPrimary = $vehicle->is_primary;
        $vehicle->delete();

        if ($wasPrimary) {
            $profile->vehicles()->first()?->update(['is_primary' => true]);
        }

        return response()->json(['message' => 'Đã xoá phương tiện.']);
    }

    public function setPrimary(Request $request, Vehicle $vehicle): JsonResponse
    {
        $profile = $this->profile($request);
        if (! $profile || $vehicle->driver_profile_id !== $profile->id) {
            return $this->notOwned();
        }

        $profile->vehicles()->update(['is_primary' => false]);
        $vehicle->update(['is_primary' => true]);

        return response()->json($vehicle);
    }
}
