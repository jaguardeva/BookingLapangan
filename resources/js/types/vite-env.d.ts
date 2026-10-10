/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_TAWKTO_ENABLED?: string;
    readonly VITE_TAWKTO_PROPERTY_ID?: string;
    readonly VITE_TAWKTO_WIDGET_ID?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

interface TawkApi {
    [key: string]: unknown;
}

interface Window {
    Tawk_API?: TawkApi;
}
