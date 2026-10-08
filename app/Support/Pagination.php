<?php

namespace App\Support;

use Illuminate\Http\Request;

final class Pagination
{
    /**
     * @var list<int>
     */
    public const PER_PAGE_OPTIONS = [10, 25, 50, 100];

    public static function perPage(Request $request, int $default): int
    {
        $requested = $request->integer('per_page');

        return in_array($requested, self::PER_PAGE_OPTIONS, true) ? $requested : $default;
    }
}
