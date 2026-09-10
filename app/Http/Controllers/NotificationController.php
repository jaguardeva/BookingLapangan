<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationController extends Controller
{
    public function index(Request $request): Response
    {
        $notifications = auth()->user()
            ->notifications()
            ->paginate(15);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
        ]);
    }

    public function fetchRecent(): JsonResponse
    {
        $user = auth()->user();
        if (! $user) {
            return response()->json(['notifications' => [], 'unread_count' => 0]);
        }

        $notifications = $user->notifications()->take(10)->get();
        $unreadCount = $user->unreadNotifications()->count();

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => $unreadCount,
        ]);
    }

    public function markAsRead(string $id): RedirectResponse
    {
        $notification = auth()->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->markAsRead();

        return back();
    }

    public function markAllAsRead(): RedirectResponse
    {
        auth()->user()->unreadNotifications->markAsRead();

        return back()->with('success', 'Semua notifikasi telah ditandai sebagai sudah dibaca.');
    }
}
