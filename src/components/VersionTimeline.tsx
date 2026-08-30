import React from 'react';
import { GitBranchIcon } from 'lucide-react';
import { relativeTime } from '../utils/documents';
import type { DocumentRecord, Version, VersionStatus } from '../types';

interface VersionTimelineProps {
  doc: DocumentRecord;
  selectedVersionId: string;
  onSelect: (versionId: string) => void;
}

const statusLabel: Record<VersionStatus, string> = {
  current: 'Current',
  main: 'main',
  branch: 'branch',
  restored: 'Restored',
  processing: 'Processing',
  failed: 'Failed',
  UPLOADING: 'Uploading',
  READY: 'Ready'
};

export function VersionTimeline({ doc, selectedVersionId, onSelect }: VersionTimelineProps) {
  const versions = [...doc.versions].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  return (
    <section
      aria-labelledby="timeline-heading"
      data-testid="version-timeline"
      className="rounded-2xl border border-line bg-surface shadow-sm overflow-hidden">
      
      <div className="border-b border-line bg-gradient-to-r from-surface to-orange-50/40 px-5 py-4 flex items-center justify-between">
        <div>
          <h2 id="timeline-heading" className="text-sm font-semibold text-ink">
            Version history
          </h2>
          <p className="mt-0.5 text-xs text-ink-muted">{doc.versionCount} immutable versions</p>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-orange-100 text-orange-800 border border-orange-200">
          <span className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" />
          Live Tree
        </span>
      </div>

      <div className="relative p-3">
        {/* Continuous Bright Orange Branch Tree Line */}
        {versions.length > 1 && (
          <div
            aria-hidden="true"
            className="absolute left-[26px] top-7 bottom-7 w-[2.5px] rounded-full bg-gradient-to-b from-orange-500 via-amber-500 to-orange-400 shadow-[0_0_8px_rgba(249,115,22,0.4)]"
          />
        )}

        <ol className="relative space-y-1">
          {versions.map((version: Version, index: number) => {
            const selected = version.id === selectedVersionId;
            const material = version.changes.filter((change) => change.material).length;
            const isLatest = index === 0;

            return (
              <li key={version.id}>
                <button
                  type="button"
                  data-testid={`version-node-${version.id}`}
                  aria-current={selected ? 'true' : undefined}
                  onClick={() => onSelect(version.id)}
                  className={`relative flex w-full items-start gap-3.5 rounded-xl px-3 py-3 text-left transition-all duration-150 ease-serene ${
                    selected
                      ? 'bg-orange-50/80 border border-orange-200/90 shadow-sm'
                      : 'hover:bg-canvas hover:border hover:border-line border border-transparent'
                  }`}
                >
                  {/* Tree Node Dot */}
                  <div className="relative z-10 mt-1 flex h-5 w-5 shrink-0 items-center justify-center">
                    {version.status === 'current' || isLatest ? (
                      <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
                        <span className="relative inline-flex h-3 w-3 rounded-full border-2 border-white bg-orange-500 shadow-md" />
                      </span>
                    ) : selected ? (
                      <span className="h-3 w-3 rounded-full border-2 border-white bg-orange-600 shadow-sm" />
                    ) : (
                      <span
                        className={`h-2.5 w-2.5 rounded-full border-2 border-white shadow-xs ${
                          version.branch === 'main'
                            ? 'bg-slate-500'
                            : 'bg-amber-500'
                        }`}
                      />
                    )}
                  </div>

                  {/* Version Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="font-mono text-sm font-semibold text-ink">{version.label}</span>
                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                          version.status === 'current'
                            ? 'bg-orange-100 text-orange-800'
                            : 'bg-canvas text-ink-muted border border-line'
                        }`}
                      >
                        {statusLabel[version.status]}
                      </span>
                      {version.branch !== 'main' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <GitBranchIcon className="h-3 w-3 text-amber-600" aria-hidden="true" />
                          {version.branch}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 truncate text-xs text-ink-muted">
                      <span className="font-medium text-ink-soft">{version.author}</span> · {relativeTime(version.timestamp)}
                    </p>

                    {material > 0 && (
                      <div className="mt-2">
                        <span className="inline-flex items-center gap-1 rounded-full bg-orange-100/90 border border-orange-200/80 px-2 py-0.5 text-[11px] font-medium text-orange-900">
                          <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                          {material} material change{material > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
