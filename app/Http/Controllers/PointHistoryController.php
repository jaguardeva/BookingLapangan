<?php

namespace App\Http\Controllers;

use App\Support\Pagination;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PointHistoryController extends Controller
{
    /**
     * Display a listing of point transactions for the authenticated user.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $filterType = $request->query('type', 'all');

        $query = $user->pointTransactions()
            ->with(['booking.lapangan', 'membership'])
            ->latest();

        if (in_array($filterType, ['earned', 'redeemed'], true)) {
            $query->where('type', $filterType);
        }

        $transactions = $query->paginate(Pagination::perPage($request, 10))->withQueryString();

        return Inertia::render('points/history', [
            'transactions' => $transactions,
            'currentFilter' => $filterType,
            'stats' => [
                'points_balance' => (int) ($user->points_balance ?? 0),
                'available_points' => (int) $user->availablePoints(),
                'total_earned' => (int) $user->pointTransactions()->where('type', 'earned')->sum('points'),
                'total_redeemed' => (int) abs($user->pointTransactions()->where('type', 'redeemed')->sum('points')),
            ],
        ]);
    }
}
