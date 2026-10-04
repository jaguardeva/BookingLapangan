<?php

use Carbon\Carbon;

test('application uses Indonesian locale and Jakarta timezone', function () {
    expect(config('app.locale'))->toBe('id')
        ->and(config('app.timezone'))->toBe('Asia/Jakarta')
        ->and(app()->getLocale())->toBe('id');
});

test('carbon formats dates in Indonesian', function () {
    $date = Carbon::parse('2026-01-15 10:30:00', 'Asia/Jakarta');

    expect($date->translatedFormat('l, d F Y'))->toBe('Kamis, 15 Januari 2026');
});
