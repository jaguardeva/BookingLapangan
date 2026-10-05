<?php

namespace App\Support;

use DateTimeInterface;
use Illuminate\Routing\UrlGenerator;
use Illuminate\Support\Facades\URL;

final class AppUrl
{
    /**
     * Generate a named route using the configured application origin.
     *
     * @param  array<string, mixed>|string|int  $parameters
     */
    public static function route(string $name, array|string|int $parameters = []): string
    {
        return self::urlGenerator()->route($name, $parameters);
    }

    /**
     * Generate a temporary signed route using the configured application origin.
     *
     * @param  array<string, mixed>  $parameters
     */
    public static function temporarySignedRoute(
        string $name,
        DateTimeInterface $expiration,
        array $parameters = [],
    ): string {
        return self::urlGenerator()->temporarySignedRoute($name, $expiration, $parameters);
    }

    private static function urlGenerator(): UrlGenerator
    {
        /** @var UrlGenerator $urlGenerator */
        $urlGenerator = clone URL::getFacadeRoot();
        $applicationUrl = (string) config('app.url');

        $urlGenerator->useOrigin($applicationUrl);
        $urlGenerator->forceScheme(parse_url($applicationUrl, PHP_URL_SCHEME) ?: null);

        return $urlGenerator;
    }
}
