<?php

namespace App\Http\Controllers;

use App\Support\InternalRedirect;
use App\Support\Pagination;
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
            ->paginate(Pagination::perPage($request, 10))
            ->withQueryString();

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

    public function markAsRead(Request $request, string $id): RedirectResponse
    {
        $notification = auth()->user()
            ->notifications()
            ->where('id', $id)
            ->firstOrFail();

        $notification->markAsRead();

        $redirectPath = InternalRedirect::path(
            $request->input('redirect'),
            route('notification.index', absolute: false),
        );

        return redirect()->to($redirectPath);
    }

    public function markAllAsRead(): RedirectResponse
    {
        auth()->user()->unreadNotifications->markAsRead();

        return back()->with('success', 'Semua notifikasi telah ditandai sebagai sudah dibaca.');
    }
}
