<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Lapangan;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class UserManagementController extends Controller
{
    public function show(User $user): Response
    {
        $this->ensureManageable($user);

        $user->load([
            'profile',
            'assignedLapangans:id,name',
            'bookings' => fn ($query) => $query->with(['lapangan:id,name', 'review'])->latest()->limit(1),
            'reviews' => fn ($query) => $query->with('booking:id,booking_code')->latest()->limit(1),
        ]);
        $user->loadCount([
            'bookings',
            'bookings as approved_bookings_count' => fn ($query) => $query->where('payment_status', 'approved'),
            'bookings as pending_bookings_count' => fn ($query) => $query->whereIn('payment_status', ['pending', 'pending_validation']),
            'bookings as cancelled_or_rejected_bookings_count' => fn ($query) => $query->whereIn('payment_status', ['cancelled', 'rejected']),
        ]);

        return Inertia::render('admin/users/show', [
            'user' => $user,
            'profile' => $user->profile,
            'avatarUrl' => $user->profile?->avatar_path
                ? Storage::disk('public')->url($user->profile->avatar_path)
                : null,
            'summary' => [
                'total' => $user->bookings_count,
                'approved' => $user->approved_bookings_count,
                'pending' => $user->pending_bookings_count,
                'cancelled_or_rejected' => $user->cancelled_or_rejected_bookings_count,
                'approved_spending' => $user->bookings()->where('payment_status', 'approved')->sum('total_price'),
                'latest' => $user->bookings->first(),
            ],
            'latestReview' => $user->reviews->first(),
        ]);
    }

    /**
     * Display users and operational admins.
     */
    public function index(Request $request): Response
    {
        $sortColumns = [
            'name' => 'name',
            'email' => 'email',
            'role' => 'role',
            'verification' => 'email_verified_at',
            'created_at' => 'created_at',
        ];
        $sort = $request->string('sort')->toString();
        $sort = array_key_exists($sort, $sortColumns) ? $sort : 'created_at';
        $direction = $request->string('direction')->lower()->toString() === 'asc' ? 'asc' : 'desc';
        $role = $request->string('role')->toString();
        $verification = $request->string('verification')->toString();

        $users = User::query()
            ->whereIn('role', ['user', 'admin'])
            ->with(['assignedLapangans:id,name', 'profile'])
            ->when($request->filled('search'), function ($query) use ($request): void {
                $search = $request->string('search')->trim()->toString();

                $query->where(function ($query) use ($search): void {
                    $query->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhereHas('profile', fn ($profileQuery) => $profileQuery->where('phone', 'like', "%{$search}%"));
                });
            })
            ->when(in_array($role, ['user', 'admin'], true), fn ($query) => $query->where('role', $role))
            ->when($verification === 'verified', fn ($query) => $query->whereNotNull('email_verified_at'))
            ->when($verification === 'unverified', fn ($query) => $query->whereNull('email_verified_at'))
            ->orderBy($sortColumns[$sort], $direction)
            ->orderBy('id')
            ->paginate(10)
            ->withQueryString();

        $users->getCollection()->transform(function (User $user): User {
            $user->setAttribute(
                'avatar_url',
                $user->profile?->avatar_path
                    ? Storage::disk('public')->url($user->profile->avatar_path)
                    : null,
            );

            return $user;
        });

        return Inertia::render('admin/users/index', [
            'users' => $users,
            'filters' => [
                'search' => $request->query('search', ''),
                'role' => $role,
                'verification' => $verification,
                'sort' => $sort,
                'direction' => $direction,
            ],
            'lapangans' => Lapangan::query()
                ->where('is_active', true)
                ->get(['id', 'name']),
        ]);
    }

    /**
     * Store a new user or operational admin.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate($this->rules());

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'password_set_at' => now(),
            'role' => $validated['role'],
            'email_verified_at' => now(),
        ]);
        $user->forceFill(['email_verified_at' => now()])->save();
        $user->profile()->create(['phone' => $validated['phone'] ?? null]);

        $this->syncLapanganAssignments($user, $validated);

        ActivityLog::log('user_created', "Superadmin membuat pengguna baru: {$user->name} ({$user->email})", [
            'user_id' => $user->id,
            'role' => $user->role,
        ]);

        return back()->with('success', "Pengguna {$user->name} berhasil ditambahkan!");
    }

    /**
     * Update a user or operational admin.
     */
    public function update(Request $request, User $user): RedirectResponse
    {
        $this->ensureManageable($user);

        $validated = $request->validate($this->rules($user));
        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'role' => $validated['role'],
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
            $updateData['password_set_at'] = now();
        }

        $user->update($updateData);
        $user->profile()->updateOrCreate([], ['phone' => $validated['phone'] ?? null]);
        $this->syncLapanganAssignments($user, $validated);

        ActivityLog::log('user_updated', "Superadmin memperbarui pengguna {$user->name}", [
            'user_id' => $user->id,
            'role' => $user->role,
        ]);

        return back()->with('success', "Data pengguna {$user->name} berhasil diperbarui!");
    }

    /**
     * Delete a user or operational admin.
     */
    public function destroy(User $user): RedirectResponse
    {
        $this->ensureManageable($user);

        if ($user->is(auth()->user())) {
            abort(422, 'Anda tidak dapat menghapus akun sendiri.');
        }

        $name = $user->name;
        $user->delete();

        ActivityLog::log('user_deleted', "Superadmin menghapus pengguna: {$name}", [
            'user_id' => $user->id,
        ]);

        return back()->with('info', "Pengguna {$name} berhasil dihapus.");
    }

    /**
     * Toggle email verification for a manageable user.
     */
    public function toggleVerification(User $user): RedirectResponse
    {
        $this->ensureManageable($user);

        $user->forceFill([
            'email_verified_at' => $user->email_verified_at ? null : now(),
        ])->save();

        ActivityLog::log(
            'user_verification_updated',
            "Superadmin mengubah status verifikasi email {$user->name}",
            ['user_id' => $user->id, 'verified' => $user->email_verified_at !== null],
        );

        return back()->with('success', 'Status verifikasi email berhasil diperbarui.');
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    private function rules(?User $user = null): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($user?->id)],
            'phone' => ['nullable', 'regex:/^08[0-9]{8,13}$/'],
            'role' => ['required', Rule::in(['user', 'admin'])],
            'password' => [$user ? 'nullable' : 'required', Password::defaults()],
            'lapangan_ids' => ['nullable', 'array'],
            'lapangan_ids.*' => ['exists:lapangans,id'],
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    private function syncLapanganAssignments(User $user, array $validated): void
    {
        if ($user->isAdmin()) {
            $user->assignedLapangans()->sync($validated['lapangan_ids'] ?? []);

            return;
        }

        $user->assignedLapangans()->detach();
    }

    private function ensureManageable(User $user): void
    {
        abort_unless(in_array($user->role, ['user', 'admin'], true), 404);
    }
}
