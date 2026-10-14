import { router } from '@inertiajs/react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

export function useFlashToast(): void {
    const lastToastRef = useRef<string | null>(null);

    useEffect(() => {
        const showSessionFlash = (flash: unknown): void => {
            if (!flash || typeof flash !== 'object') {
                lastToastRef.current = null;
                return;
            }

            const data = flash as Record<string, unknown>;
            const messages = [
                typeof data.success === 'string' ? ['success', data.success] : null,
                typeof data.error === 'string' ? ['error', data.error] : null,
                typeof data.info === 'string' ? ['info', data.info] : null,
            ].filter((message): message is [string, string] => message !== null);

            if (messages.length === 0) {
                lastToastRef.current = null;
                return;
            }

            messages.forEach(([type, message]) => {
                const key = `${type}:${message}`;

                if (lastToastRef.current === key) {
                    return;
                }

                lastToastRef.current = key;
                toast[type as 'success' | 'error' | 'info'](message, { id: key });
            });
        };

        const removeSuccessListener = router.on('success', (event) => {
            showSessionFlash(event.detail.page.props.flash);
        });

        const removeFlashListener = router.on('flash', (event) => {
            const data = event.detail.flash?.toast as FlashToast | undefined;

            if (!data || !data.message) {
                return;
            }

            const key = `${data.type}:${data.message}`;

            if (lastToastRef.current === key) {
                return;
            }

            lastToastRef.current = key;
            toast[data.type](data.message, { id: key });
        });

        return () => {
            removeSuccessListener();
            removeFlashListener();
        };
    }, []);
}
