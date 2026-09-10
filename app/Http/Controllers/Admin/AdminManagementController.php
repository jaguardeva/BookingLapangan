<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Lapangan;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

class AdminManagementController extends Controller
{
    public function index(): Response
    {
        $admins = User::where('role', 'admin')
            ->with('assignedLapangans')
            ->latest()
            ->paginate(10);

        $lapangans = Lapangan::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('admin/admins/index', [
            'admins' => $admins,
            'lapangans' => $lapangans,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['required', Password::defaults()],
            'lapangan_ids' => ['nullable', 'array'],
            'lapangan_ids.*' => ['exists:lapangans,id'],
        ]);

        $admin = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($validated['password']),
            'role' => 'admin',
            'email_verified_at' => now(),
        ]);

        if (! empty($validated['lapangan_ids'])) {
            $admin->assignedLapangans()->sync($validated['lapangan_ids']);
        }

        ActivityLog::log('admin_created', "Superadmin membuat admin kasir baru: {$admin->name} ({$admin->email})", [
            'admin_id' => $admin->id,
        ]);

        return back()->with('success', "Admin {$admin->name} berhasil ditambahkan!");
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        if ($user->role !== 'admin') {
            abort(400, 'User bukan admin.');
        }

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email,'.$user->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'password' => ['nullable', Password::defaults()],
            'lapangan_ids' => ['nullable', 'array'],
            'lapangan_ids.*' => ['exists:lapangans,id'],
        ]);

        $updateData = [
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'] ?? null,
        ];

        if (! empty($validated['password'])) {
            $updateData['password'] = Hash::make($validated['password']);
        }

        $user->update($updateData);

        if (isset($validated['lapangan_ids'])) {
            $user->assignedLapangans()->sync($validated['lapangan_ids']);
        }

        ActivityLog::log('admin_updated', "Superadmin memperbarui profil admin {$user->name}", [
            'admin_id' => $user->id,
        ]);

        return back()->with('success', "Data admin {$user->name} berhasil diperbarui!");
    }

    public function destroy(User $user): RedirectResponse
    {
        if ($user->role !== 'admin') {
            abort(400, 'Hanya user dengan role admin yang dapat dihapus melalui menu ini.');
        }

        $name = $user->name;
        $user->delete();

        ActivityLog::log('admin_deleted', "Superadmin menghapus admin kasir: {$name}");

        return back()->with('info', "Admin {$name} berhasil dihapus.");
    }
}
