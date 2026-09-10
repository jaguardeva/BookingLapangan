<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    public function index(): Response
    {
        $logs = ActivityLog::with('user')
            ->latest()
            ->paginate(20);

        return Inertia::render('admin/logs/index', [
            'logs' => $logs,
        ]);
    }
}
