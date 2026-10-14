<?php

namespace App\Services;

use Carbon\Carbon;
use Carbon\CarbonInterface;

class MembershipOccurrenceService
{
    public function nextDateForWeekday(CarbonInterface $from, int $weekday): Carbon
    {
        $cursor = $from->copy()->startOfDay();

        while ($cursor->dayOfWeek !== $weekday) {
            $cursor = $cursor->addDay();
        }

        return Carbon::parse($cursor->toDateString())->startOfDay();
    }

    /**
     * @return array<int, string>
     */
    public function datesForPeriod(CarbonInterface $start, CarbonInterface $end, int $weekday): array
    {
        $cursor = $start->copy()->startOfDay();
        $boundary = $end->copy()->startOfDay();
        $dates = [];

        while ($cursor->lte($boundary)) {
            if ($cursor->dayOfWeek === $weekday) {
                $dates[] = $cursor->toDateString();
            }

            $cursor = $cursor->addDay();
        }

        return $dates;
    }

    /**
     * @param  array<int, array{weekday: int}>  $reservations
     */
    public function firstDateForRollingPeriod(array $reservations, CarbonInterface $minimumStart, int $periodDays = 30): ?Carbon
    {
        $cursor = $minimumStart->copy()->startOfDay();
        $weekdays = collect($reservations)->pluck('weekday')->map(fn ($weekday): int => (int) $weekday)->unique();

        while ($cursor->lt($minimumStart->copy()->addDays(7))) {
            if ($weekdays->contains($cursor->dayOfWeek)) {
                return Carbon::parse($cursor->toDateString())->startOfDay();
            }

            $cursor = $cursor->addDay();
        }

        return null;
    }

    /**
     * @return array<int, string>
     */
    public function datesForMonth(Carbon $month, int $weekday, ?CarbonInterface $minimumStart = null): array
    {
        $cursor = $month->copy()->startOfMonth();
        $boundary = $minimumStart?->copy()->startOfDay();

        if ($boundary !== null && $boundary->gt($cursor)) {
            $cursor = $boundary;
        }

        $dates = [];
        while ($cursor->month === $month->month && $cursor->year === $month->year) {
            if ($cursor->dayOfWeek === $weekday) {
                $dates[] = $cursor->toDateString();
            }

            $cursor = $cursor->addDay();
        }

        return $dates;
    }

    /**
     * @param  array<int, array{weekday: int}>  $reservations
     */
    public function firstDateForReservations(array $reservations, Carbon $month, ?CarbonInterface $minimumStart = null): ?Carbon
    {
        $dates = collect($reservations)
            ->flatMap(fn (array $reservation): array => $this->datesForMonth($month, (int) $reservation['weekday'], $minimumStart))
            ->sort()
            ->values();

        return $dates->isEmpty() ? null : Carbon::parse($dates->first())->startOfDay();
    }
}
