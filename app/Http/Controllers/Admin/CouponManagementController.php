<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Coupon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CouponManagementController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/coupons/index', ['coupons' => Coupon::query()->latest()->paginate(15)]);
    }

    public function store(Request $request): RedirectResponse
    {
        $coupon = Coupon::create($this->validated($request));
        ActivityLog::log('coupon_created', "Kupon {$coupon->code} dibuat.", ['coupon_id' => $coupon->id]);

        return back()->with('success', 'Kupon berhasil dibuat.');
    }

    public function update(Request $request, Coupon $coupon): RedirectResponse
    {
        $coupon->update($this->validated($request, $coupon));

        return back()->with('success', 'Kupon berhasil diperbarui.');
    }

    public function toggle(Coupon $coupon): RedirectResponse
    {
        $coupon->update(['is_active' => ! $coupon->is_active]);

        return back()->with('info', 'Status kupon berhasil diperbarui.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        abort_if($coupon->redemptions()->exists(), 422, 'Kupon yang sudah digunakan tidak dapat dihapus.');
        $coupon->delete();

        return back()->with('info', 'Kupon berhasil dihapus.');
    }

    /** @return array<string, mixed> */
    private function validated(Request $request, ?Coupon $coupon = null): array
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:50', Rule::unique('coupons', 'code')->ignore($coupon?->id)],
            'discount_type' => ['required', Rule::in(['percentage', 'fixed'])],
            'discount_value' => ['required', 'numeric', 'gt:0'],
            'minimum_order_amount' => ['required', 'integer', 'min:0'],
            'maximum_discount_amount' => ['nullable', 'integer', 'min:1'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'per_user_limit' => ['nullable', 'integer', 'min:1'],
            'starts_at' => ['nullable', 'date'],
            'ends_at' => ['nullable', 'date', 'after_or_equal:starts_at'],
            'is_active' => ['required', 'boolean'],
        ]);

        if ($data['discount_type'] === 'percentage' && $data['discount_value'] > 100) {
            abort(422, 'Diskon persentase tidak boleh lebih dari 100%.');
        }

        $data['code'] = Str::upper(trim($data['code']));

        return $data;
    }
}
