import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DownloadIcon, SearchIcon, CheckIcon } from 'lucide-react';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useVaultData } from '../lib/vault-data';
import { absoluteTime } from '../utils/documents';
import type { ActivityType } from '../types';

const typeLabel: Record<ActivityType, string> = {
  DOCUMENT_CREATED: 'Document created',
  VERSION_CREATED: 'Version created',
  CHANGE_DETECTED: 'Change detected',
  BRANCH_CREATED: 'Branch created',
  AI_PROPOSAL_CREATED: 'AI proposal created',
  HUMAN_APPROVED: 'Human approved',
  VERSION_RESTORED: 'Version restored',
  PERMISSION_CHANGED: 'Permission changed',
  DOCUMENT_DOWNLOADED: 'Document downloaded',
};

const filters: Array<{ id: 'all' | 'changes' | 'ai' | 'access'; label: string; types: ActivityType[] }> = [
  { id: 'all', label: 'Everything', types: [] },
  { id: 'changes', label: 'Versions & changes', types: ['DOCUMENT_CREATED', 'VERSION_CREATED', 'CHANGE_DETECTED', 'VERSION_RESTORED', 'BRANCH_CREATED'] },
  { id: 'ai', label: 'AI & approvals', types: ['AI_PROPOSAL_CREATED', 'HUMAN_APPROVED'] },
  { id: 'access', label: 'Access', types: ['PERMISSION_CHANGED', 'DOCUMENT_DOWNLOADED'] },
];

export function Activity() {
  const { activityEvents, loading, error, refresh } = useVaultData();
  const [active, setActive] = useState<'all' | 'changes' | 'ai' | 'access'>('all');
  const [search, setSearch] = useState('');
  const [exported, setExported] = useState(false);

  const selected = filters.find((filter) => filter.id === active);
  const events = (
    !selected || selected.types.length === 0
      ? activityEvents
      : activityEvents.filter((event) => selected.types.includes(event.type))
  ).filter((event) =>
    search.trim() === ''
      ? true
      : `${event.detail} ${event.actor} ${event.documentTitle}`
          .toLowerCase()
          .includes(search.toLowerCase())
  );

  function handleExport() {
    const jsonStr = JSON.stringify(events, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `versionvault-audit-trail-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);

    setExported(true);
    setTimeout(() => setExported(false), 2500);
  }

  if (loading) {
    return <LoadingState label="Loading audit trail" rows={5} />;
  }

  if (error) {
    return <ErrorState variant="unavailable" description={error} onRetry={() => void refresh()} />;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-eyebrow text-orange-800 font-semibold">Activity</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Audit trail</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
            Strictly append-only events recorded with cryptographic immutability.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-orange-50 hover:border-orange-200">
          {exported ? (
            <>
              <CheckIcon className="h-4 w-4 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Exported JSON</span>
            </>
          ) : (
            <>
              <DownloadIcon className="h-4 w-4 text-ink-muted" />
              <span>Export Audit Trail</span>
            </>
          )}
        </button>
      </header>

      {/* Filter and Search Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter.id}
              type="button"
              aria-pressed={active === filter.id}
              onClick={() => setActive(filter.id)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 ease-serene ${
                active === filter.id
                  ? 'border-orange-300 bg-orange-100 text-orange-950 shadow-xs'
                  : 'border-line bg-surface text-ink-soft hover:bg-canvas'
              }`}>
              {filter.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[200px] flex-1 max-w-xs">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-ink-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit events…"
            className="w-full rounded-xl border border-line bg-surface pl-9 pr-3.5 py-2 text-xs font-medium text-ink placeholder:text-ink-muted focus:border-orange-500 focus:outline-none"
          />
        </div>
      </div>

      {events.length === 0 ? (
        <div className="mt-12 text-center py-12 rounded-2xl border border-line bg-surface">
          <p className="text-sm text-ink-muted">No audit events match your filter.</p>
        </div>
      ) : (
        <ol className="mt-8 border-l-2 border-orange-300/80 pl-6 space-y-6">
          {events.map((event) => (
            <li key={event.id} className="relative">
              <span
                aria-hidden="true"
                className="absolute -left-[1.95rem] top-1.5 h-3 w-3 rounded-full border-2 border-white bg-orange-500 shadow-xs"
              />
              <p className="text-sm font-semibold text-ink">{typeLabel[event.type]}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{event.detail}</p>
              <p className="mt-1.5 text-xs text-ink-muted">
                <span className="font-medium text-ink">{event.actor}</span> · {absoluteTime(event.timestamp)} · <span className="font-mono text-amber-800 bg-amber-50 px-1 py-0.5 rounded border border-amber-200">{event.branch}</span> ·{' '}
                <Link
                  to={`/documents/${event.documentId}`}
                  className="text-orange-700 font-medium hover:text-orange-900 underline decoration-orange-300 underline-offset-4">
                  {event.documentTitle}
                </Link>
              </p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
