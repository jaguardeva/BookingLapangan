<?php

namespace App\Support;

final class InternalRedirect
{
    public static function path(mixed $path, string $fallback): string
    {
        if (! is_string($path) || ! str_starts_with($path, '/') || str_starts_with($path, '//')) {
            return $fallback;
        }

        if (str_contains($path, '\\') || preg_match('/[\r\n]/', $path) === 1) {
            return $fallback;
        }

        $parsedPath = parse_url($path);

        if (! is_array($parsedPath) || isset($parsedPath['scheme']) || isset($parsedPath['host'])) {
            return $fallback;
        }

        return $path;
    }
}
