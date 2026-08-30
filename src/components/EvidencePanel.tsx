import React from 'react';
import { ShieldCheckIcon } from 'lucide-react';
import { absoluteTime, shortHash } from '../utils/documents';
import type { DocumentRecord, StructuredChange, Version } from '../types';

interface EvidencePanelProps {
  doc: DocumentRecord;
  from: Version;
  to: Version;
  change: StructuredChange;
}

function Row({ label, value, mono }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line/80 py-3 last:border-b-0">
      <dt className="label-eyebrow text-ink-muted">{label}</dt>
      <dd className={`text-sm font-medium text-ink ${mono ? 'font-mono text-xs text-ink-soft bg-canvas px-2 py-0.5 rounded border border-line' : ''}`}>
        {value}
      </dd>
    </div>
  );
}

export function EvidencePanel({ doc, from, to, change }: EvidencePanelProps) {
  return (
    <section
      aria-labelledby="evidence-heading"
      data-testid="evidence-panel"
      className="rounded-2xl border border-line bg-surface px-6 py-5 shadow-xs">
      
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
          <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
        </span>
        <h2 id="evidence-heading" className="text-sm font-semibold tracking-wide text-ink">
          Verified evidence
        </h2>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        Recorded deterministically at the time the version was created.
      </p>

      <dl className="mt-4">
        <Row label="Source versions" value={`${from.label} → ${to.label}`} />
        <Row label="Section" value={change.section} />
        <Row label="Previous value" value={<span className="text-ink-muted line-through">{change.previous}</span>} />
        <Row label="Current value" value={<span className="text-orange-600 font-semibold">{change.current}</span>} />
        <Row label="Actor" value={to.author} />
        <Row label="Timestamp" value={absoluteTime(to.timestamp)} />
        <Row
          label="Branch"
          value={
            <span className="font-mono text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              {to.branch}
            </span>
          }
        />
        <Row label="Source" value={to.source} />
        <Row label="Hash" value={`SHA-256 ${shortHash(to.hash)}`} mono />
        <Row
          label="Integrity"
          value={
            <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" />
              {doc.integrity === 'verified' ? 'SHA-256 verified' : 'Unverified'}
            </span>
          }
        />
      </dl>
    </section>
  );
}