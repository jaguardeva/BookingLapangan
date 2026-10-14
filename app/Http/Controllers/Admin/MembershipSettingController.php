<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\MembershipSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class MembershipSettingController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'membership_discount_percentage' => ['required', 'integer', 'between:0,100'],
        ]);

        $setting = MembershipSetting::query()->updateOrCreate(
            ['id' => MembershipSetting::ID],
            ['membership_discount_percentage' => $validated['membership_discount_percentage']],
        );

        ActivityLog::log('membership_discount_updated', 'Persentase diskon membership diperbarui.', [
            'membership_discount_percentage' => $setting->membership_discount_percentage,
        ]);

        return back()->with('success', 'Diskon membership berhasil diperbarui.');
    }
}
