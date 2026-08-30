import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, LayersIcon } from 'lucide-react';

const chain = [
  { step: 'What changed', detail: 'Payment Terms · 30 days → 15 days' },
  { step: 'Proof', detail: 'SHA-256 verified · V17 → V18' },
  { step: 'Who', detail: 'Authenticated user - main' },
  { step: 'When', detail: '28 Aug 2026, 14:12' },
  { step: 'Why it matters', detail: 'Payment window reduced by 50%' },
];

export function Landing() {
  return (
    <div className="min-h-full w-full bg-canvas">
      <header className="border-b border-line bg-surface/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <span className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-xs"
            >
              <LayersIcon className="h-4 w-4" />
            </span>
            <span className="font-serif text-xl font-semibold tracking-tight text-ink">
              Version<span className="text-orange-600">Vault</span>
            </span>
          </span>
          <nav aria-label="Account" className="ml-auto flex items-center gap-3">
            <Link
              to="/login"
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors duration-150 ease-serene hover:bg-canvas hover:text-ink">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-all duration-150 ease-serene hover:from-orange-500 hover:to-amber-500 hover:shadow-sm">
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-900 mb-6">
                <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
                Evidence-first document version control
              </div>
              <h1 className="font-serif text-4xl leading-[1.15] text-ink sm:text-5xl font-semibold">
                Every document change, with the <span className="text-orange-600 underline decoration-orange-300 decoration-wavy decoration-1">proof</span> still attached.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
                VersionVault records each revision as an immutable version. You see exactly what
                changed, who changed it, and when — before anything interprets it for you.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-all duration-150 ease-serene hover:from-orange-500 hover:to-amber-500 hover:shadow-md">
                  Open the workspace
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/documents/vendor-agreement/compare/v18"
                  className="rounded-lg border border-line bg-surface px-5 py-3 text-sm font-medium text-ink transition-colors duration-150 ease-serene hover:bg-orange-50 hover:border-orange-200">
                  See a real comparison
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-orange-400/20 to-amber-300/10 rounded-full blur-2xl pointer-events-none" />
              <p className="label-eyebrow text-orange-800 font-semibold">Vendor Agreement · V17 → V18</p>
              <h2 className="mt-1 font-serif text-2xl text-ink font-semibold">Payment Terms</h2>
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <p className="label-eyebrow">Previous</p>
                  <p className="mt-1 font-serif text-3xl text-ink-muted line-through decoration-ink-muted/50 decoration-1">
                    30 days
                  </p>
                </div>
                <div>
                  <p className="label-eyebrow">Current</p>
                  <p className="mt-1 font-serif text-3xl font-semibold text-orange-600">15 days</p>
                </div>
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-900">
                  <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-orange-600" />
                  Material change · Financial · High
                </span>
              </div>
              <dl className="mt-6 border-t border-line pt-5 text-sm">
                <div className="flex items-baseline justify-between gap-4 py-1.5">
                  <dt className="label-eyebrow">Actor</dt>
                  <dd className="font-medium text-ink">Authenticated user</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-1.5">
                  <dt className="label-eyebrow">Integrity</dt>
                  <dd className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">SHA-256 verified</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface py-16">
          <div className="mx-auto max-w-6xl px-6">
            <p className="label-eyebrow text-center">How evidence flows</p>
            <h2 className="mt-2 text-center font-serif text-3xl text-ink font-semibold">
              The chain of custody for every change
            </h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {chain.map((item, idx) => (
                <div
                  key={item.step}
                  className="rounded-xl border border-line bg-canvas/60 p-5 transition-all duration-150 hover:border-orange-200 hover:bg-surface hover:shadow-xs"
                >
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 font-mono text-xs font-semibold text-orange-800">
                    {idx + 1}
                  </span>
                  <h3 className="mt-3 font-medium text-ink">{item.step}</h3>
                  <p className="mt-1 text-xs text-ink-soft leading-relaxed">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
