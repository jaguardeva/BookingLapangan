import { useCallback, useEffect, useState } from 'react';

function getRemainingSeconds(targetTimestamp: number | null): number {
    if (!targetTimestamp) return 0;
    const diff = Math.ceil((targetTimestamp - Date.now()) / 1000);
    return diff > 0 ? diff : 0;
}

export function useCooldown(
    storageKey: string,
    initialSeconds = 0,
    defaultDuration = 60,
) {
    const [cooldown, setCooldown] = useState<number>(() => {
        if (typeof window === 'undefined') return initialSeconds;

        let remainingFromStorage = 0;
        try {
            const raw = window.localStorage.getItem(storageKey);
            if (raw) {
                const targetTimestamp = parseInt(raw, 10);
                remainingFromStorage = getRemainingSeconds(targetTimestamp);
                if (remainingFromStorage <= 0) {
                    window.localStorage.removeItem(storageKey);
                }
            }
        } catch {
            // localStorage might be unavailable
        }

        const effective = Math.max(remainingFromStorage, initialSeconds);

        if (effective > 0) {
            try {
                const targetTimestamp = Date.now() + effective * 1000;
                window.localStorage.setItem(
                    storageKey,
                    targetTimestamp.toString(),
                );
            } catch {
                // Ignore storage write error
            }
        }

        return effective;
    });

    // Handle updates when initialSeconds changes (e.g. fresh prop from backend)
    useEffect(() => {
        if (initialSeconds > 0) {
            setCooldown((prev) => {
                if (initialSeconds > prev) {
                    try {
                        const targetTimestamp =
                            Date.now() + initialSeconds * 1000;
                        window.localStorage.setItem(
                            storageKey,
                            targetTimestamp.toString(),
                        );
                    } catch {
                        // Ignore storage write error
                    }
                    return initialSeconds;
                }
                return prev;
            });
        }
    }, [initialSeconds, storageKey]);

    const startCooldown = useCallback(
        (durationInSeconds = defaultDuration) => {
            const targetTimestamp = Date.now() + durationInSeconds * 1000;
            try {
                window.localStorage.setItem(
                    storageKey,
                    targetTimestamp.toString(),
                );
            } catch {
                // Ignore storage write error
            }
            setCooldown(durationInSeconds);
        },
        [defaultDuration, storageKey],
    );

    const resetCooldown = useCallback(() => {
        try {
            window.localStorage.removeItem(storageKey);
        } catch {
            // Ignore storage write error
        }
        setCooldown(0);
    }, [storageKey]);

    // Interval ticker and storage sync
    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setInterval(() => {
            let targetTimestamp: number | null = null;
            try {
                const raw = window.localStorage.getItem(storageKey);
                if (raw) {
                    targetTimestamp = parseInt(raw, 10);
                }
            } catch {
                // Ignore storage error
            }

            const remaining = getRemainingSeconds(targetTimestamp);

            if (remaining <= 0) {
                clearInterval(timer);
                try {
                    window.localStorage.removeItem(storageKey);
                } catch {
                    // Ignore storage error
                }
                setCooldown(0);
            } else {
                setCooldown(remaining);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldown, storageKey]);

    // Sync across tabs
    useEffect(() => {
        const handleStorage = (event: StorageEvent) => {
            if (event.key === storageKey) {
                if (!event.newValue) {
                    setCooldown(0);
                } else {
                    const target = parseInt(event.newValue, 10);
                    setCooldown(getRemainingSeconds(target));
                }
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [storageKey]);

    return {
        cooldown,
        isActive: cooldown > 0,
        startCooldown,
        resetCooldown,
    };
}
