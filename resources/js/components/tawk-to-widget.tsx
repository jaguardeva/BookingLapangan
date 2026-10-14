import { useEffect } from 'react';

const tawkScriptId = 'tawk-to-widget-script';
const tawkPropertyId = import.meta.env.VITE_TAWKTO_PROPERTY_ID;
const tawkWidgetId = import.meta.env.VITE_TAWKTO_WIDGET_ID;
const isTawkEnabled = import.meta.env.VITE_TAWKTO_ENABLED === 'true';

let tawkLoadPromise: Promise<void> | null = null;
let activePublicLayoutCount = 0;

function setTawkWidgetVisibility(isVisible: boolean): void {
    const visibilityMethod = isVisible
        ? window.Tawk_API?.showWidget
        : window.Tawk_API?.hideWidget;

    if (typeof visibilityMethod === 'function') {
        visibilityMethod.call(window.Tawk_API);
    }
}

function loadTawkTo(): Promise<void> {
    if (!isTawkEnabled || !tawkPropertyId || !tawkWidgetId) {
        return Promise.resolve();
    }

    if (typeof window.Tawk_API?.showWidget === 'function') {
        return Promise.resolve();
    }

    if (tawkLoadPromise) {
        return tawkLoadPromise;
    }

    tawkLoadPromise = new Promise((resolve, reject) => {
        const existingScript = document.getElementById(tawkScriptId);

        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(), {
                once: true,
            });
            existingScript.addEventListener('error', () => reject(), {
                once: true,
            });

            return;
        }

        const script = document.createElement('script');

        script.id = tawkScriptId;
        script.src = `https://embed.tawk.to/${tawkPropertyId}/${tawkWidgetId}`;
        script.async = true;
        script.charset = 'UTF-8';
        script.crossOrigin = '*';
        script.addEventListener('load', () => resolve(), { once: true });
        script.addEventListener('error', () => reject(), { once: true });

        document.body.appendChild(script);
    });

    return tawkLoadPromise;
}

export function TawkToWidget() {
    useEffect(() => {
        activePublicLayoutCount += 1;

        if (!isTawkEnabled || !tawkPropertyId || !tawkWidgetId) {
            return () => {
                activePublicLayoutCount = Math.max(0, activePublicLayoutCount - 1);
            };
        }

        if (typeof window.Tawk_API?.showWidget === 'function') {
            setTawkWidgetVisibility(true);
        } else {
            void loadTawkTo()
                .then(() => {
                    setTawkWidgetVisibility(activePublicLayoutCount > 0);
                })
                .catch(() => {
                    tawkLoadPromise = null;
                    console.error('Unable to load the Tawk.to chat widget.');
                });
        }

        return () => {
            activePublicLayoutCount = Math.max(0, activePublicLayoutCount - 1);

            if (activePublicLayoutCount === 0) {
                setTawkWidgetVisibility(false);
            }
        };
    }, []);

    return null;
}
