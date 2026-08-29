import React from 'react';
import { ArrowRightIcon } from 'lucide-react';
import { MaterialChangeBadge } from './MaterialChangeBadge';
import type { StructuredChange } from '../types';

interface DiffViewerProps {
  change: StructuredChange;
  fromLabel: string;
  toLabel: string;
}

export function DiffViewer({ change, fromLabel, toLabel }: DiffViewerProps) {
  return (
    <section
      aria-labelledby="diff-heading"
      data-testid="diff-viewer"
      className="overflow-hidden rounded-2xl border border-line bg-surface">
      
      <div className="border-b border-line px-6 py-5 sm:px-8">
        <p className="label-eyebrow">Verified change · {fromLabel} → {toLabel}</p>
        <h2 id="diff-heading" className="mt-1 font-serif text-2xl text-ink">
          {change.section}
        </h2>
      </div>

      <div className="grid gap-px bg-line sm:grid-cols-[1fr_auto_1fr]">
        <div className="bg-surface px-6 py-7 sm:px-8">
          <p className="label-eyebrow">Previous</p>
          <p className="mt-2 font-serif text-3xl text-ink-soft line-through decoration-ink-muted/40 decoration-1">
            {change.previous}
          </p>
        </div>
        <div className="flex items-center justify-center bg-surface px-6 py-2 sm:px-4">
          <ArrowRightIcon
            className="h-5 w-5 rotate-90 text-ink-muted sm:rotate-0"
            aria-hidden="true" />
          
          <span className="sr-only">changed to</span>
        </div>
        <div className="bg-surface px-6 py-7 sm:px-8">
          <p className="label-eyebrow">Current</p>
          <p className="mt-2 font-serif text-3xl text-ink">{change.current}</p>
        </div>
      </div>

      <div className="border-t border-line px-6 py-5 sm:px-8">
        <MaterialChangeBadge
          category={change.category}
          severity={change.severity}
          material={change.material} />
        
      </div>

      <div className="border-t border-line bg-canvas px-6 py-6 sm:px-8">
        <p className="label-eyebrow">Clause text</p>
        <div className="mt-3 space-y-2">
          <p className="rounded-lg border border-line bg-surface px-4 py-3 text-sm leading-relaxed text-ink-soft">
            <span className="mr-2 font-mono text-xs text-ink-muted">−</span>
            {change.previousText}
          </p>
          <p className="rounded-lg border border-sage-200 bg-sage-50 px-4 py-3 text-sm leading-relaxed text-ink">
            <span className="mr-2 font-mono text-xs text-sage-600">+</span>
            {change.currentText}
          </p>
        </div>
      </div>
    </section>);

}