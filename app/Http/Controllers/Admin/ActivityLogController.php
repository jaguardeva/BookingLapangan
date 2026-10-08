<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Support\Pagination;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function index(Request $request): Response
    {
        $logs = ActivityLog::with('user')
            ->latest()
            ->paginate(Pagination::perPage($request, 10))
            ->withQueryString();

        return Inertia::render('admin/logs/index', [
            'logs' => $logs,
        ]);
    }
}
