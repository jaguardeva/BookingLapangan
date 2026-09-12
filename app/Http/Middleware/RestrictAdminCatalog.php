<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictAdminCatalog
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        $isNotificationEndpoint = $request->is('notifications/recent')
            || $request->is('notifications/mark-all-read')
            || $request->is('notifications/*/read')
            || $request->is('lapangan/*/slots');

        if ($user?->isAdmin() && ! $user->isSuperAdmin() && ! $isNotificationEndpoint) {
            return redirect()->route('admin.dashboard')->with(
                'info',
                'Admin diarahkan ke workspace admin. Halaman publik hanya tersedia untuk user dan superadmin.',
            );
        }

        return $next($request);
    }
}
