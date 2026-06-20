<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BankSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankSettingController extends Controller
{
    public function show(): JsonResponse
    {
        return response()->json(BankSetting::current());
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'bank_id' => 'required|string|max:20',
            'account_number' => 'required|string|max:50',
            'account_name' => 'required|string|max:100',
        ]);

        $setting = BankSetting::updateOrCreate([], $data);

        return response()->json($setting);
    }
}
