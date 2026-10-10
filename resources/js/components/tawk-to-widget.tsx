import { useEffect } from 'react';

const tawkScriptId = 'tawk-to-widget-script';
const tawkPropertyId = import.meta.env.VITE_TAWKTO_PROPERTY_ID;
const tawkWidgetId = import.meta.env.VITE_TAWKTO_WIDGET_ID;
const isTawkEnabled = import.meta.env.VITE_TAWKTO_ENABLED === 'true';

let tawkLoadPromise: Promise<void> | null = null;

function loadTawkTo(): Promise<void> {
    if (!isTawkEnabled || !tawkPropertyId || !tawkWidgetId) {
        return Promise.resolve();
    }

    if (window.Tawk_API) {
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
        if (!isTawkEnabled || !tawkPropertyId || !tawkWidgetId) {
            return;
        }

        void loadTawkTo().catch(() => {
            tawkLoadPromise = null;
            console.error('Unable to load the Tawk.to chat widget.');
        });
    }, []);

    return null;
}
