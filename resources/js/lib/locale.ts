export const INDONESIAN_LOCALE = 'id-ID';
export const INDONESIAN_TIMEZONE = 'Asia/Jakarta';

const toDate = (value: Date | string | number): Date =>
    value instanceof Date ? value : new Date(value);

export function formatDateIndonesia(
    value: Date | string | number,
    options: Intl.DateTimeFormatOptions = {},
): string {
    return new Intl.DateTimeFormat(INDONESIAN_LOCALE, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: INDONESIAN_TIMEZONE,
        ...options,
    }).format(toDate(value));
}

export function formatDateTimeIndonesia(
    value: Date | string | number,
    options: Intl.DateTimeFormatOptions = {},
): string {
    return new Intl.DateTimeFormat(INDONESIAN_LOCALE, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: INDONESIAN_TIMEZONE,
        ...options,
    }).format(toDate(value));
}

export function formatTimeIndonesia(value: Date | string | number): string {
    const parts = new Intl.DateTimeFormat(INDONESIAN_LOCALE, {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: INDONESIAN_TIMEZONE,
        hourCycle: 'h23',
    }).formatToParts(toDate(value));

    const hour = parts.find((part) => part.type === 'hour')?.value ?? '00';
    const minute = parts.find((part) => part.type === 'minute')?.value ?? '00';

    return `${hour}:${minute}`;
}
