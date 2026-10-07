<?php

use App\Http\Controllers\Admin\ActivityLogController;
use App\Http\Controllers\Admin\BankAccountController;
use App\Http\Controllers\Admin\BookingManagementController;
use App\Http\Controllers\Admin\CatalogManagementController;
use App\Http\Controllers\Admin\CategoryManagementController;
use App\Http\Controllers\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Admin\FacilityManagementController;
use App\Http\Controllers\Admin\LapanganManagementController;
use App\Http\Controllers\Admin\ReportController;
use App\Http\Controllers\Admin\UserManagementController;
use App\Http\Controllers\Admin\WhatsappContactController;
use App\Http\Controllers\Auth\GoogleAuthController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LapanganController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ReviewController;
use App\Support\InternalRedirect;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// --- Public Routes ---
Route::middleware('guest')->group(function () {
    Route::get('/auth/google/redirect', [GoogleAuthController::class, 'redirect'])->name('auth.google.redirect');
    Route::get('/auth/google/callback', [GoogleAuthController::class, 'callback'])->name('auth.google.callback');
});

Route::middleware(['admin.workspace'])->group(function () {
    Route::get('/', [HomeController::class, 'index'])->name('home');
});
Route::middleware(['public.catalog'])->group(function () {
    Route::get('/lapangan', [LapanganController::class, 'index'])->name('lapangan.index');
    Route::get('/lapangan/{slug}', [LapanganController::class, 'show'])->name('lapangan.show');
    Route::get('/lapangan/{lapangan}/slots', [LapanganController::class, 'getSlots'])->name('lapangan.slots');
});

// --- Customer / Authenticated Routes ---
Route::middleware(['auth', 'admin.workspace'])->group(function () {
    Route::get('/email/verify', [EmailVerificationController::class, 'notice'])->name('verification.notice');
    Route::post('/email/verify', [EmailVerificationController::class, 'verify'])
        ->middleware('throttle:6,1')
        ->name('verification.verify');
    Route::post('/email/verification-notification', [EmailVerificationController::class, 'send'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Smart dashboard redirection based on role & email verification status
    Route::get('/dashboard', function (Request $request) {
        $user = auth()->user();

        // 1. Unverified users must verify email first
        if (! $user->hasVerifiedEmail()) {
            return redirect()->route('verification.notice');
        }

        // 2. Superadmin and Admin always go to admin workspace
        if ($user->isSuperAdmin() || $user->isAdmin()) {
            return redirect()->to(InternalRedirect::path(
                config('auth.redirects.admin'),
                route('admin.dashboard', absolute: false),
            ));
        }

        // 3. User just completed email verification
        if ($request->has('verified')) {
            return redirect()->to(InternalRedirect::path(
                config('auth.redirects.after_verification'),
                route('booking.history', absolute: false),
            ))->with('success', 'Email Anda berhasil diverifikasi! Selamat datang di '.config('app.name').'.');
        }

        // 4. Regular verified user redirected to intended page or booking history
        return redirect()->intended(InternalRedirect::path(
            config('auth.redirects.member'),
            route('booking.history', absolute: false),
        ));
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

        // Notification actions
        Route::get('/notifications', [NotificationController::class, 'index'])->name('notification.index');
        Route::get('/notifications/recent', [NotificationController::class, 'fetchRecent'])->name('notification.recent');
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markAsRead'])->name('notification.read');
        Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead'])->name('notification.read-all');
    });

    Route::get('/booking/checkout/{lapangan:slug}', [BookingController::class, 'checkout'])->name('booking.checkout');
});

// --- Admin & Superadmin Workspace ---
Route::prefix('admin')->as('admin.')->middleware(['auth', 'role:superadmin,admin'])->group(function () {
    Route::get('/', [AdminDashboardController::class, 'index'])->name('dashboard');
    Route::get('/bookings', [BookingManagementController::class, 'index'])->name('bookings.index');
    Route::get('/bookings/manual', [BookingManagementController::class, 'createManual'])->name('bookings.manual.create');
    Route::post('/bookings/manual', [BookingManagementController::class, 'storeManual'])->name('bookings.manual');
    Route::post('/bookings/{booking}/approve', [BookingManagementController::class, 'approve'])->name('bookings.approve');
    Route::post('/bookings/{booking}/reject', [BookingManagementController::class, 'reject'])->name('bookings.reject');
    Route::get('/reports', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/reports/export', [ReportController::class, 'exportCsv'])->name('reports.export');

    // Superadmin-only controls
    Route::middleware(['role:superadmin'])->group(function () {
        Route::get('/catalog', [CatalogManagementController::class, 'index'])->name('catalog.index');
        Route::post('/categories', [CategoryManagementController::class, 'store'])->name('categories.store');
        Route::put('/categories/{category}', [CategoryManagementController::class, 'update'])->name('categories.update');
        Route::post('/categories/{category}/toggle', [CategoryManagementController::class, 'toggle'])->name('categories.toggle');
        Route::post('/facilities', [FacilityManagementController::class, 'store'])->name('facilities.store');
        Route::put('/facilities/{facility}', [FacilityManagementController::class, 'update'])->name('facilities.update');

        // Lapangan Management
        Route::get('/lapangans', [LapanganManagementController::class, 'index'])->name('lapangans.index');
        Route::get('/lapangans/create', [LapanganManagementController::class, 'create'])->name('lapangans.create');
        Route::get('/lapangans/{lapangan}/edit', [LapanganManagementController::class, 'edit'])->name('lapangans.edit');
        Route::post('/lapangans', [LapanganManagementController::class, 'store'])->name('lapangans.store');
        Route::put('/lapangans/{lapangan}', [LapanganManagementController::class, 'update'])->name('lapangans.update');
        Route::post('/lapangans/{lapangan}/toggle', [LapanganManagementController::class, 'toggleStatus'])->name('lapangans.toggle');
        Route::delete('/lapangans/{lapangan}', [LapanganManagementController::class, 'destroy'])->name('lapangans.destroy');

        // User Management
        Route::get('/users', [UserManagementController::class, 'index'])->name('users.index');
        Route::get('/users/{user}', [UserManagementController::class, 'show'])->name('users.show');
        Route::post('/users', [UserManagementController::class, 'store'])->name('users.store');
        Route::put('/users/{user}', [UserManagementController::class, 'update'])->name('users.update');
        Route::patch('/users/{user}/verification', [UserManagementController::class, 'toggleVerification'])->name('users.verification');
        Route::delete('/users/{user}', [UserManagementController::class, 'destroy'])->name('users.destroy');
        Route::redirect('/admins', '/admin/users')->name('admins.index');

        // Bank Accounts Management
        Route::get('/banks', [BankAccountController::class, 'index'])->name('banks.index');
        Route::post('/banks', [BankAccountController::class, 'store'])->name('banks.store');
        Route::put('/banks/{bankAccount}', [BankAccountController::class, 'update'])->name('banks.update');
        Route::post('/banks/{bankAccount}/toggle', [BankAccountController::class, 'toggle'])->name('banks.toggle');
        Route::delete('/banks/{bankAccount}', [BankAccountController::class, 'destroy'])->name('banks.destroy');

        // Activity Logs
        Route::get('/logs', [ActivityLogController::class, 'index'])->name('logs.index');

        // WhatsApp Contact Management
        Route::get('/whatsapp-contacts', [WhatsappContactController::class, 'index'])->name('whatsapp-contacts.index');
        Route::post('/whatsapp-contacts', [WhatsappContactController::class, 'store'])->name('whatsapp-contacts.store');
        Route::put('/whatsapp-contacts/{whatsappContact}', [WhatsappContactController::class, 'update'])->name('whatsapp-contacts.update');
        Route::post('/whatsapp-contacts/{whatsappContact}/toggle', [WhatsappContactController::class, 'toggle'])->name('whatsapp-contacts.toggle');
        Route::delete('/whatsapp-contacts/{whatsappContact}', [WhatsappContactController::class, 'destroy'])->name('whatsapp-contacts.destroy');
    });
});

require __DIR__.'/settings.php';
