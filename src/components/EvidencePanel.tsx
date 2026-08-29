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

function Row({ label, value, mono }: {label: string;value: React.ReactNode;mono?: boolean;}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-line py-3 last:border-b-0">
      <dt className="label-eyebrow">{label}</dt>
      <dd className={`text-sm text-ink ${mono ? 'font-mono text-xs' : ''}`}>{value}</dd>
    </div>);

}

export function EvidencePanel({ doc, from, to, change }: EvidencePanelProps) {
  return (
    <section
      aria-labelledby="evidence-heading"
      data-testid="evidence-panel"
      className="rounded-2xl border border-line bg-surface px-6 py-5">
      
      <div className="flex items-center gap-2">
        <ShieldCheckIcon className="h-4 w-4 text-sage-600" aria-hidden="true" />
        <h2 id="evidence-heading" className="text-sm font-medium tracking-wide text-ink">
          Verified evidence
        </h2>
      </div>
      <p className="mt-1 text-xs text-ink-muted">
        Recorded deterministically at the time the version was created.
      </p>

      <dl className="mt-4">
        <Row label="Source versions" value={`${from.label} → ${to.label}`} />
        <Row label="Section" value={change.section} />
        <Row label="Previous value" value={change.previous} />
        <Row label="Current value" value={change.current} />
        <Row label="Actor" value={to.author} />
        <Row label="Timestamp" value={absoluteTime(to.timestamp)} />
        <Row label="Branch" value={to.branch} />
        <Row label="Source" value={to.source} />
        <Row label="Hash" value={shortHash(to.hash)} mono />
        <Row
          label="Integrity"
          value={
          <span className="text-sage-700">
              {doc.integrity === 'verified' ? 'SHA-256 verified' : 'Unverified'}
            </span>
          } />
        
      </dl>
    </section>);

}