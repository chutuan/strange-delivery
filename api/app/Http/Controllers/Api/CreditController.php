<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankSetting;
use App\Models\CreditTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreditController extends Controller
{
    public function balance(Request $request): JsonResponse
    {
        $profile = $request->user()->driverProfile;

        if (! $profile) {
            return response()->json(['message' => 'Bạn chưa đăng ký tài xế.'], 403);
        }

        return response()->json([
            'credits' => $profile->credits,
            'bank_setting' => BankSetting::current(),
            'driver_id' => $request->user()->id,
        ]);
    }

    public function history(Request $request): JsonResponse
    {
        $transactions = CreditTransaction::where('driver_id', $request->user()->id)
            ->latest()
            ->paginate(20);

        return response()->json($transactions);
    }
}
