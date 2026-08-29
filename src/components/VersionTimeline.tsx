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
      className="rounded-2xl border border-line bg-surface">
      
      <div className="border-b border-line px-5 py-4">
        <h2 id="timeline-heading" className="text-sm font-medium text-ink">
          Version history
        </h2>
        <p className="mt-0.5 text-xs text-ink-muted">{doc.versionCount} immutable versions</p>
      </div>

      <ol className="p-3">
        {versions.map((version: Version) => {
          const selected = version.id === selectedVersionId;
          const material = version.changes.filter((change) => change.material).length;
          return (
            <li key={version.id}>
              <button
                type="button"
                data-testid={`version-node-${version.id}`}
                aria-current={selected ? 'true' : undefined}
                onClick={() => onSelect(version.id)}
                className={`flex w-full gap-3 rounded-xl px-3 py-3 text-left transition-colors duration-150 ease-serene ${
                selected ? 'bg-sage-50' : 'hover:bg-canvas'}`
                }>
                
                <span className="relative mt-1 flex w-4 justify-center" aria-hidden="true">
                  <span
                    className={`h-2.5 w-2.5 rounded-full border-2 ${
                    version.status === 'current' ?
                    'border-sage-600 bg-sage-600' :
                    version.branch === 'main' ?
                    'border-ink-muted bg-surface' :
                    'border-slate2-600 bg-surface'}`
                    } />
                  
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-sm text-ink">{version.label}</span>
                    <span
                      className={`text-[11px] ${
                      version.status === 'current' ? 'text-sage-700' : 'text-ink-muted'}`
                      }>
                      
                      {statusLabel[version.status]}
                    </span>
                    {version.branch !== 'main' ?
                    <GitBranchIcon className="h-3 w-3 text-slate2-600" aria-hidden="true" /> :
                    null}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-ink-muted">
                    {version.author} · {relativeTime(version.timestamp)}
                  </span>
                  {material > 0 ?
                  <span className="mt-1.5 inline-block rounded-full bg-clay-50 px-2 py-0.5 text-[11px] text-clay-700">
                      {material} material change{material > 1 ? 's' : ''}
                    </span> :
                  null}
                </span>
              </button>
            </li>);

        })}
      </ol>
    </section>);

}