<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\CreditTransaction;
use App\Models\DriverProfile;
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

    public function requests(Request $request): JsonResponse
    {
        $pending = CreditTransaction::with('driver:id,name,email,phone')
            ->where('type', 'topup')
            ->where('status', 'pending')
            ->oldest()
            ->paginate(30);

        return response()->json($pending);
    }

    public function addCredits(Request $request): JsonResponse
    {
        // Approval is tied to a specific top-up request via its reference_code.
        // Crediting is the request's own amount — not an admin-chosen number — and
        // the request is transitioned pending -> completed atomically so the same
        // bank transfer can never be approved twice (no replay / over-credit).
        $data = $request->validate([
            'reference_code' => 'required|string',
            'description' => 'nullable|string|max:255',
        ]);

        try {
            $txn = DB::transaction(function () use ($data) {
                $txn = CreditTransaction::lockForUpdate()
                    ->where('reference_code', $data['reference_code'])
                    ->first();

                if (! $txn || $txn->type !== 'topup' || $txn->status !== 'pending') {
                    throw new \RuntimeException('not_pending');
                }

                $profile = DriverProfile::lockForUpdate()->where('user_id', $txn->driver_id)->first();
                if (! $profile) {
                    throw new \RuntimeException('no_profile');
                }

                $profile->increment('credits', $txn->amount);

                $txn->update([
                    'status' => 'completed',
                    'description' => $data['description'] ?? "Nạp {$txn->amount} credit (đã duyệt)",
                ]);

                return $txn;
            });
        } catch (\RuntimeException $e) {
            return match ($e->getMessage()) {
                'not_pending' => response()->json(['message' => 'Yêu cầu nạp không tồn tại hoặc đã được xử lý.'], 422),
                'no_profile' => response()->json(['message' => 'Tài xế không tồn tại.'], 422),
                default => throw $e,
            };
        }

        $credits = DriverProfile::where('user_id', $txn->driver_id)->value('credits');

        return response()->json([
            'credits' => $credits,
            'message' => "Đã duyệt và nạp {$txn->amount} credit thành công.",
        ]);
    }

    public function transactions(Request $request): JsonResponse
    {
        // The ledger view shows only completed transactions (balance == SUM(amount)).
        $txns = CreditTransaction::with('driver:id,name,email')
            ->where('status', 'completed')
            ->when($request->driver_id, fn ($q, $id) => $q->where('driver_id', $id))
            ->latest()
            ->paginate(30);

        return response()->json($txns);
    }
}
