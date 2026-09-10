<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Review;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'booking_id' => ['required', 'exists:bookings,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $booking = Booking::where('id', $validated['booking_id'])
            ->where('user_id', auth()->id())
            ->firstOrFail();

        if ($booking->payment_status !== 'approved') {
            return back()->with('error', 'Hanya booking yang telah dikonfirmasi yang dapat diulas.');
        }

        if ($booking->review()->exists()) {
            return back()->with('error', 'Anda sudah memberikan ulasan untuk booking ini.');
        }

        Review::create([
            'booking_id' => $booking->id,
            'lapangan_id' => $booking->lapangan_id,
            'user_id' => auth()->id(),
            'rating' => $validated['rating'],
            'comment' => $validated['comment'] ?? null,
        ]);

        return back()->with('success', 'Terima kasih atas ulasan dan penilaian Anda!');
    }
}
