import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRightIcon, RotateCcwIcon, ShieldCheckIcon, DownloadIcon, CheckIcon } from 'lucide-react';
import { MaterialChangeBadge } from './MaterialChangeBadge';
import { absoluteTime, shortHash } from '../utils/documents';
import { generateFormalDocumentMarkdown } from '../utils/exportDocument';
import type { DocumentRecord, Version } from '../types';

interface VersionInspectorProps {
  doc: DocumentRecord;
  version: Version;
  parent?: Version;
  onRestore: () => void;
}

export function VersionInspector({ doc, version, parent, onRestore }: VersionInspectorProps) {
  const [downloaded, setDownloaded] = useState(false);

  function handleDownload() {
    const content = generateFormalDocumentMarkdown(doc, version);
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.id}-${version.label.toLowerCase()}-verified.md`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  }

  return (
    <section
      aria-labelledby="inspector-heading"
      data-testid="version-inspector"
      className="rounded-2xl border border-line bg-surface shadow-xs overflow-hidden">
      
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5 bg-gradient-to-r from-surface to-orange-50/30">
        <div>
          <p className="label-eyebrow text-orange-800">
            {parent ? `${parent.label} → ${version.label}` : `${version.label} · first version`}
          </p>
          <h2 id="inspector-heading" className="mt-1 font-serif text-xl font-semibold text-ink">
            {version.summary}
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            <span className="font-medium text-ink-soft">{version.author}</span> · {absoluteTime(version.timestamp)} · <span className="font-mono text-xs text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">{version.branch}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleDownload}
            title="Download verified snapshot"
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-orange-50 hover:border-orange-200">
            {downloaded ? (
              <>
                <CheckIcon className="h-4 w-4 text-emerald-600" />
                <span className="text-emerald-700">Downloaded</span>
              </>
            ) : (
              <>
                <DownloadIcon className="h-4 w-4 text-ink-muted" />
                <span>Download</span>
              </>
            )}
          </button>
          <button
            type="button"
            data-testid="version-restore"
            onClick={onRestore}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-orange-50 hover:border-orange-200">
            <RotateCcwIcon className="h-4 w-4 text-ink-muted" />
            Restore
          </button>
          {parent ? (
            <Link
              to={`/documents/${doc.id}/compare/${version.id}`}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-all hover:from-orange-500 hover:to-amber-500">
              Open comparison
              <ArrowUpRightIcon className="h-4 w-4" />
            </Link>
          ) : null}
        </div>
      </div>

      <div className="divide-y divide-line">
        {version.changes.length === 0 ? (
          <p className="px-6 py-8 text-sm text-ink-muted">
            No structured changes were detected in this version.
          </p>
        ) : (
          version.changes.map((change) => (
            <article key={change.id} className="px-6 py-5 hover:bg-orange-50/20 transition-colors">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-sm font-semibold text-ink">{change.section}</h3>
                <MaterialChangeBadge
                  category={change.category}
                  severity={change.severity}
                  material={change.material}
                />
              </div>
              <p className="mt-3 flex flex-wrap items-baseline gap-2 font-serif text-lg">
                <span className="text-ink-muted line-through decoration-1">{change.previous}</span>
                <span aria-hidden="true" className="text-orange-500 font-bold">→</span>
                <span className="text-ink font-semibold">{change.current}</span>
              </p>
            </article>
          ))
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line bg-canvas/80 px-6 py-4">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-600" />
          Cryptographic Integrity
        </span>
        <span data-testid="version-hash" className="font-mono text-xs font-medium text-ink-soft bg-surface px-2.5 py-1 rounded-md border border-line">
          SHA-256 {shortHash(version.hash)}
        </span>
      </div>
    </section>
  );
}