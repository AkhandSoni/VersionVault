import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, RotateCcwIcon } from 'lucide-react';
import { MaterialChangeBadge } from './MaterialChangeBadge';
import { absoluteTime, shortHash } from '../utils/documents';
import type { DocumentRecord, Version } from '../types';

interface VersionInspectorProps {
  doc: DocumentRecord;
  version: Version;
  parent?: Version;
  onRestore: () => void;
}

export function VersionInspector({ doc, version, parent, onRestore }: VersionInspectorProps) {
  return (
    <section
      aria-labelledby="inspector-heading"
      data-testid="version-inspector"
      className="rounded-2xl border border-line bg-surface">
      
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div>
          <p className="label-eyebrow">
            {parent ? `${parent.label} → ${version.label}` : `${version.label} · first version`}
          </p>
          <h2 id="inspector-heading" className="mt-1 font-serif text-xl text-ink">
            {version.summary}
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            {version.author} · {absoluteTime(version.timestamp)} · {version.branch}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="version-restore"
            onClick={onRestore}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-canvas px-3.5 py-2 text-sm text-ink transition-colors duration-150 ease-serene hover:bg-sage-50">
            
            <RotateCcwIcon className="h-4 w-4" aria-hidden="true" />
            Restore
          </button>
          {parent ?
          <Link
            to={`/documents/${doc.id}/compare/${version.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 ease-serene hover:bg-sage-700">
            
              Open comparison
              <ArrowUpRightIcon className="h-4 w-4" aria-hidden="true" />
            </Link> :
          null}
        </div>
      </div>

      <div className="divide-y divide-line">
        {version.changes.length === 0 ?
        <p className="px-6 py-8 text-sm text-ink-muted">
            No structured changes were detected in this version.
          </p> :

        version.changes.map((change) =>
        <article key={change.id} className="px-6 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-medium text-ink">{change.section}</h3>
                <MaterialChangeBadge
              category={change.category}
              severity={change.severity}
              material={change.material} />
            
              </div>
              <p className="mt-3 flex flex-wrap items-baseline gap-2 font-serif text-lg">
                <span className="text-ink-muted line-through decoration-1">{change.previous}</span>
                <span aria-hidden="true" className="text-ink-muted">→</span>
                <span className="text-ink">{change.current}</span>
              </p>
            </article>
        )
        }
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas px-6 py-4">
        <span className="label-eyebrow">Integrity</span>
        <span data-testid="version-hash" className="font-mono text-xs text-ink-soft">
          SHA-256 {shortHash(version.hash)}
        </span>
      </div>
    </section>);

}