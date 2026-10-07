<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\ProfileDeleteRequest;
use App\Http\Requests\Settings\ProfileUpdateRequest;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    /**
     * Show the user's profile settings page.
     */
    public function edit(Request $request): Response
    {
        $page = $request->user()->isAdmin() || $request->user()->isSuperAdmin()
            ? 'settings/profile'
            : 'profile';

        return Inertia::render($page, [
            'mustVerifyEmail' => $request->user() instanceof MustVerifyEmail,
            'status' => $request->session()->get('status'),
        ]);
    }

    /**
     * Update the user's profile information.
     */
    public function update(ProfileUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();
        $user = $request->user();
        $user->fill(array_intersect_key($validated, array_flip(['name', 'email'])));

        if ($user->isDirty('email')) {
            $user->email_verified_at = null;
        }

        $user->save();
        $user->profile()->updateOrCreate([], array_diff_key($validated, array_flip(['name', 'email'])));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Profile updated.')]);

        return to_route('profile.edit');
    }

    public function updateAvatar(Request $request): RedirectResponse
    {
        $request->validate(['avatar' => ['required', 'image', 'mimes:jpeg,jpg,png,webp', 'max:1024']]);
        $user = $request->user();
        $profile = $user->profile()->firstOrCreate([]);
        $oldPath = $profile->avatar_path;
        try {
            $path = $request->file('avatar')->store("avatars/{$user->id}", 'public');
        } catch (\Throwable $exception) {
            report($exception);

            throw ValidationException::withMessages([
                'avatar' => 'Foto profil gagal disimpan. Pastikan storage production memiliki permission yang benar.',
            ]);
        }

        if (! is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'avatar' => 'Foto profil gagal disimpan. Silakan coba lagi.',
            ]);
        }

        $profile->update(['avatar_path' => $path]);

        if ($oldPath) {
            Storage::disk('public')->delete($oldPath);
        }

        return back()->with('success', 'Foto profil berhasil diperbarui.');
    }

    public function destroyAvatar(Request $request): RedirectResponse
    {
        $profile = $request->user()->profile()->first();
        if ($profile?->avatar_path) {
            $path = $profile->avatar_path;
            Storage::disk('public')->delete($path);
            $profile->forceFill(['avatar_path' => null])->save();
        }

        return back()->with('success', 'Foto profil berhasil dihapus.');
    }

    /**
     * Delete the user's profile.
     */
    public function destroy(ProfileDeleteRequest $request): RedirectResponse
    {
        $user = $request->user();

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
