<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditTransaction;
use App\Models\DriverProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminCreditController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = DriverProfile::with('user:id,name,email,phone')
            ->when($request->q, function ($q, $search) {
                $q->whereHas('user', function ($uq) use ($search) {
                    $uq->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->orderByDesc('credits')
            ->paginate(20);

        return response()->json($query);
    }

    public function addCredits(Request $request): JsonResponse
    {
        $data = $request->validate([
            'driver_id' => 'required|integer|exists:users,id',
            'amount' => 'required|integer|min:1|max:100000',
            'description' => 'nullable|string|max:255',
        ]);

        $profile = DriverProfile::where('user_id', $data['driver_id'])->first();

        if (! $profile) {
            return response()->json(['message' => 'Tài xế không tồn tại.'], 422);
        }

        DB::transaction(function () use ($data, $profile) {
            $profile->increment('credits', $data['amount']);

            CreditTransaction::create([
                'driver_id' => $data['driver_id'],
                'amount' => $data['amount'],
                'type' => 'topup',
                'description' => $data['description'] ?? "Nạp {$data['amount']} credit bởi admin",
            ]);
        });

        return response()->json([
            'credits' => $profile->fresh()->credits,
            'message' => "Đã nạp {$data['amount']} credit thành công.",
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        $txns = CreditTransaction::with('driver:id,name,email')
            ->when($request->driver_id, fn ($q, $id) => $q->where('driver_id', $id))
            ->latest()
            ->paginate(30);

        return response()->json($txns);
    }
}
