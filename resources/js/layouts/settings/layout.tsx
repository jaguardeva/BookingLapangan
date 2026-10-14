import type { PropsWithChildren } from 'react';
import { PublicLayout } from '@/layouts/public-layout';

export default function SettingsLayout({ children }: PropsWithChildren) {
    return (
        <PublicLayout>
            <main className="public-container max-w-3xl py-8 sm:py-10">
                <div className="space-y-8">
                    {children}
                </div>
            </main>
        </PublicLayout>
    );
}
