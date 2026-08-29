import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon } from 'lucide-react';

const chain = [
{ step: 'What changed', detail: 'Payment Terms · 30 days → 15 days' },
{ step: 'Proof', detail: 'SHA-256 verified · V17 → V18' },
{ step: 'Who', detail: 'Akhand Pratap · main' },
{ step: 'When', detail: '28 Aug 2026, 14:12' },
{ step: 'Why it matters', detail: 'Payment window reduced by 50%' }];


export function Landing() {
  return (
    <div className="min-h-full w-full bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-6">
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="h-6 w-6 rounded-md border border-sage-200 bg-sage-50" />
            <span className="font-serif text-lg text-ink">VersionVault</span>
          </span>
          <nav aria-label="Account" className="ml-auto flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3.5 py-2 text-sm text-ink-soft transition-colors duration-150 ease-serene hover:bg-canvas">
              
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-sage-600 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 ease-serene hover:bg-sage-700">
              
              Get started
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <div>
              <h1 className="font-serif text-4xl leading-[1.15] text-ink sm:text-5xl">
                Every document change, with the proof still attached.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
                VersionVault records each revision as an immutable version. You see exactly what
                changed, who changed it, and when — before anything interprets it for you.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-5 py-3 text-sm font-medium text-white transition-colors duration-150 ease-serene hover:bg-sage-700">
                  
                  Open the workspace
                  <ArrowRightIcon className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  to="/documents/vendor-agreement/compare/v18"
                  className="rounded-lg border border-line bg-surface px-5 py-3 text-sm text-ink transition-colors duration-150 ease-serene hover:bg-sage-50">
                  
                  See a real comparison
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-line bg-surface p-6 shadow-soft sm:p-8">
              <p className="label-eyebrow">Vendor Agreement · V17 → V18</p>
              <h2 className="mt-1 font-serif text-2xl text-ink">Payment Terms</h2>
              <div className="mt-6 grid grid-cols-2 gap-6">
                <div>
                  <p className="label-eyebrow">Previous</p>
                  <p className="mt-1 font-serif text-3xl text-ink-soft line-through decoration-1">
                    30 days
                  </p>
                </div>
                <div>
                  <p className="label-eyebrow">Current</p>
                  <p className="mt-1 font-serif text-3xl text-ink">15 days</p>
                </div>
              </div>
              <p className="mt-6 inline-flex items-center gap-1.5 rounded-full border border-clay-100 bg-clay-50 px-2.5 py-1 text-xs font-medium text-clay-700">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
                Material change · Financial · High
              </p>
              <dl className="mt-6 border-t border-line pt-5 text-sm">
                <div className="flex items-baseline justify-between gap-4 py-1.5">
                  <dt className="label-eyebrow">Actor</dt>
                  <dd className="text-ink">Akhand Pratap</dd>
                </div>
                <div className="flex items-baseline justify-between gap-4 py-1.5">
                  <dt className="label-eyebrow">Integrity</dt>
                  <dd className="font-mono text-xs text-sage-700">SHA-256 verified</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>

        <section className="border-t border-line bg-surface py-16">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="font-serif text-2xl text-ink">How a change is read</h2>
            <ol className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
              {chain.map((item, index) =>
              <li key={item.step} className="border-t border-line pt-4">
                  <p className="font-mono text-xs text-ink-muted">0{index + 1}</p>
                  <p className="mt-2 text-sm font-medium text-ink">{item.step}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{item.detail}</p>
                </li>
              )}
            </ol>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 lg:grid-cols-2">
            <article className="rounded-2xl border border-line bg-surface p-7">
              <ShieldCheckIcon className="h-5 w-5 text-sage-600" aria-hidden="true" />
              <h3 className="mt-4 font-serif text-xl text-ink">Verified evidence</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Old value, new value, actor, timestamp, branch, and hash — recorded when the version
                was created and never rewritten.
              </p>
            </article>
            <article className="rounded-2xl border border-dashed border-line bg-canvas p-7">
              <SparklesIcon className="h-5 w-5 text-slate2-600" aria-hidden="true" />
              <h3 className="mt-4 font-serif text-xl text-ink">AI interpretation, clearly labelled</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Explanations sit beside the record, never on top of it, and always carry their own
                approval state.
              </p>
            </article>
          </div>
        </section>
      </main>

      <footer className="border-t border-line bg-surface py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-6 text-xs text-ink-muted">
          <span>VersionVault</span>
          <span className="ml-auto">Immutable history for documents that matter.</span>
        </div>
      </footer>
    </div>);

}