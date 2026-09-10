<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\AdminManagementController;
use App\Http\Controllers\Admin\BankAccountController;
use App\Http\Controllers\Admin\BookingManagementController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\InternalChatController;
use App\Http\Controllers\Admin\LapanganManagementController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LapanganController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReviewController;
use App\Http\Controllers\User\ChatController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Public Routes ---
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/lapangan', [LapanganController::class, 'index'])->name('lapangan.index');
Route::get('/lapangan/{slug}', [LapanganController::class, 'show'])->name('lapangan.show');
Route::get('/lapangan/{lapangan}/slots', [LapanganController::class, 'getSlots'])->name('lapangan.slots');

// --- Customer / Authenticated Routes ---
Route::middleware(['auth'])->group(function () {
    // Smart dashboard redirection based on role & email verification status
    Route::get('/dashboard', function (Request $request) {
        $user = auth()->user();

        // 1. Unverified users must verify email first
        if (! $user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        // 2. Superadmin and Admin always go to admin workspace
        if ($user->isSuperAdmin() || $user->isAdmin()) {
            return redirect()->route('admin.dashboard');
        }

        // 3. User just completed email verification
        if ($request->has('verified')) {
            return redirect()->route('booking.history')->with('success', 'Email Anda berhasil diverifikasi! Selamat datang di SportBooking.');
        }

        // 4. Regular verified user redirected to intended page or booking history
        return redirect()->intended(route('booking.history'));
    })->name('dashboard');

    // Customer actions requiring verified email
    Route::middleware(['verified'])->group(function () {
        // Booking actions
        Route::post('/booking', [BookingController::class, 'store'])->name('booking.store');
        Route::get('/booking/{booking_code}', [BookingController::class, 'show'])->name('booking.show');
        Route::post('/booking/{booking_code}/submit-payment', [BookingController::class, 'submitPayment'])->name('booking.submit-payment');
        Route::post('/booking/{booking_code}/cancel', [BookingController::class, 'cancel'])->name('booking.cancel');
        Route::get('/my-bookings', [BookingController::class, 'history'])->name('booking.history');

        // Review action
        Route::post('/reviews', [ReviewController::class, 'store'])->name('review.store');

        // Chat action
        Route::get('/chat', [ChatController::class, 'index'])->name('chat.index');
        Route::post('/chat/messages', [ChatController::class, 'storeMessage'])->name('chat.store-message');
        Route::post('/chat/{conversation}/read', [ChatController::class, 'markRead'])->name('chat.read');

        // Notification actions
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notification.index');
        Route::get('/notifications/recent', [NotificationController::class, 'fetchRecent'])->name('notification.recent');
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notification.read');
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notification.read-all');
    });
});

// --- Admin & Superadmin Workspace ---
Route::prefix('admin')->as('admin.')->middleware(['auth', 'role:superadmin,admin'])->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/bookings', [BookingManagementController::class, 'index'])->name('bookings.index');
    Route::post('/bookings/{booking}/approve', [BookingManagementController::class, 'approve'])->name('bookings.approve');
    Route::post('/bookings/{booking}/reject', [BookingManagementController::class, 'reject'])->name('bookings.reject');
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'exportCsv'])->name('reports.export');

    // Admin Chat
    Route::get('/chat', [App\Http\Controllers\Admin\ChatController::class, 'index'])->name('chat.index');
    Route::post('/chat/{conversation}/claim', [App\Http\Controllers\Admin\ChatController::class, 'claim'])->name('chat.claim');
    Route::post('/chat/{conversation}/resolve', [App\Http\Controllers\Admin\ChatController::class, 'resolve'])->name('chat.resolve');
    Route::post('/chat/{conversation}/messages', [App\Http\Controllers\Admin\ChatController::class, 'storeMessage'])->name('chat.store-message');

    // Internal Chat (Koordinasi antar Admin/Superadmin)
    Route::get('/internal-chat', [InternalChatController::class, 'index'])->name('internal-chat.index');
    Route::get('/internal-chat/staff', [InternalChatController::class, 'staffList'])->name('internal-chat.staff');
    Route::post('/internal-chat/start-direct', [InternalChatController::class, 'startDirect'])->name('internal-chat.start-direct');
    Route::post('/internal-chat/create-group', [InternalChatController::class, 'createGroup'])->name('internal-chat.create-group');
    Route::post('/internal-chat/{conversation}/messages', [InternalChatController::class, 'storeMessage'])->name('internal-chat.store-message');
    Route::delete('/internal-chat/messages/{message}', [InternalChatController::class, 'destroyMessage'])->name('internal-chat.destroy-message');
    Route::delete('/internal-chat/{conversation}', [InternalChatController::class, 'destroyConversation'])->name('internal-chat.destroy-conversation');
    Route::post('/internal-chat/{conversation}/read', [InternalChatController::class, 'markRead'])->name('internal-chat.mark-read');

    // Superadmin-only controls
    Route::middleware(['role:superadmin'])->group(function () {
        // Lapangan Management
        Route::get('/lapangans', [LapanganManagementController::class, 'index'])->name('lapangans.index');
        Route::post('/lapangans', [LapanganManagementController::class, 'store'])->name('lapangans.store');
        Route::put('/lapangans/{lapangan}', [LapanganManagementController::class, 'update'])->name('lapangans.update');
        Route::post('/lapangans/{lapangan}/toggle', [LapanganManagementController::class, 'toggleStatus'])->name('lapangans.toggle');
        Route::delete('/lapangans/{lapangan}', [LapanganManagementController::class, 'destroy'])->name('lapangans.destroy');

        // Admin Management
        Route::get('/admins', [AdminManagementController::class, 'index'])->name('admins.index');
        Route::post('/admins', [AdminManagementController::class, 'store'])->name('admins.store');
        Route::put('/admins/{user}', [AdminManagementController::class, 'update'])->name('admins.update');
        Route::delete('/admins/{user}', [AdminManagementController::class, 'destroy'])->name('admins.destroy');

        // Bank Accounts Management
        Route::get('/banks', [BankAccountController::class, 'index'])->name('banks.index');
        Route::post('/banks', [BankAccountController::class, 'store'])->name('banks.store');
        Route::put('/banks/{bankAccount}', [BankAccountController::class, 'update'])->name('banks.update');
        Route::post('/banks/{bankAccount}/toggle', [BankAccountController::class, 'toggle'])->name('banks.toggle');
        Route::delete('/banks/{bankAccount}', [BankAccountController::class, 'destroy'])->name('banks.destroy');

        // Activity Logs
        Route::get('/logs', [ActivityLogController::class, 'index'])->name('logs.index');
    });
});

require __DIR__.'/settings.php';
