<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BankSetting;
use App\Models\CreditTransaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

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

    public function requestTopUp(Request $request): JsonResponse
    {
        $request->validate(['amount' => 'required|integer|min:1|max:50']);

        $profile = $request->user()->driverProfile;
        if (! $profile) {
            return response()->json(['message' => 'Bạn chưa đăng ký tài xế.'], 403);
        }

        do {
            $code = 'SD' . strtoupper(Str::random(8));
        } while (CreditTransaction::where('reference_code', $code)->exists());

        CreditTransaction::create([
            'driver_id'      => $request->user()->id,
            'amount'         => $request->amount,
            'type'           => 'topup',
            'status'         => 'new',
            'description'    => "Yêu cầu nạp {$request->amount} credit",
            'reference_code' => $code,
        ]);

        return response()->json(['reference_code' => $code, 'amount' => $request->amount]);
    }

    public function history(Request $request): JsonResponse
    {
        $type = $request->query('type');

        $query = CreditTransaction::where('driver_id', $request->user()->id)
            ->when($type, fn ($q) => $q->where('type', $type))
            ->latest();

        return response()->json($query->paginate(20)->withQueryString());
    }
}
