'use client';

import dynamic from 'next/dynamic';
import { VisionVaultLogo } from '@/components/VisionVaultLogo';

const ClientApp = dynamic(() => import('@/App').then((module) => module.App), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen bg-canvas px-6 py-12" role="status" aria-live="polite">
      <div className="mx-auto max-w-2xl rounded-2xl border border-line bg-surface p-8 shadow-xs">
        <VisionVaultLogo compact />
        <p className="mt-3 font-serif text-2xl font-semibold text-ink">Loading evidence workspace...</p>
      </div>
    </main>
  ),
});

/**
 * The single browser application mounted by the Next.js production routes.
 * App contains the established evidence-first UI and talks to the same
 * authorization-scoped /api/v1 contract as the server routes.
 */
export default function NextVaultApp() {
  return <ClientApp />;
}
