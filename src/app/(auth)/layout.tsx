// ============================================================
// VersionVault — Auth Layout
// ============================================================

import React from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-zinc-100 selection:bg-emerald-500/20 selection:text-emerald-300 px-4">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <Link href="/" className="inline-flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200 group-hover:border-zinc-500 transition-colors shadow-lg">
            <svg className="w-4.5 h-4.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <span className="font-bold tracking-tight text-lg text-zinc-100">
            VersionVault
          </span>
        </Link>
        <p className="mt-1 text-xs text-zinc-500 font-mono">Evidence-First Document Version Control</p>
      </div>

      {/* Main Form Box */}
      <div className="w-full max-w-md p-6 sm:p-8 bg-zinc-900/80 border border-zinc-800 rounded-xl shadow-2xl backdrop-blur-md">
        {children}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-zinc-600 font-mono">
        Cryptographic SHA-256 integrity & multi-tenant isolation
      </div>
    </div>
  );
}
