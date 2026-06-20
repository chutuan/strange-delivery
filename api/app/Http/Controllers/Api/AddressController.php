<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()
            ->orderByDesc('is_default')
            ->latest()
            ->get();

        return response()->json($addresses);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validateData($request);

        $address = DB::transaction(function () use ($request, $data) {
            if (! empty($data['is_default'])) {
                $request->user()->addresses()->update(['is_default' => false]);
            }

            return $request->user()->addresses()->create($data);
        });

        return response()->json($address, 201);
    }

    public function update(Request $request, Address $address): JsonResponse
    {
        $this->authorizeOwner($request, $address);

        $data = $this->validateData($request);

        DB::transaction(function () use ($request, $address, $data) {
            if (! empty($data['is_default'])) {
                $request->user()->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }

            $address->update($data);
        });

        return response()->json($address->fresh());
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        $this->authorizeOwner($request, $address);

        $address->delete();

        return response()->json(['message' => 'Đã xoá địa chỉ.']);
    }

    private function validateData(Request $request): array
    {
        return $request->validate([
            'label' => 'required|string|max:50',
            'address' => 'required|string|max:255',
            'recipient_name' => 'nullable|string|max:100',
            'recipient_phone' => 'nullable|string|max:20',
            'is_default' => 'sometimes|boolean',
        ]);
    }

    private function authorizeOwner(Request $request, Address $address): void
    {
        abort_unless($address->user_id === $request->user()->id, 403, 'Không có quyền.');
    }
}
