import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { activityEvents } from '../data/documents';
import { absoluteTime } from '../utils/documents';
import type { ActivityType } from '../types';

const typeLabel: Record<ActivityType, string> = {
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
  { id: 'changes', label: 'Versions & changes', types: ['VERSION_CREATED', 'CHANGE_DETECTED', 'VERSION_RESTORED', 'BRANCH_CREATED'] },
  { id: 'ai', label: 'AI & approvals', types: ['AI_PROPOSAL_CREATED', 'HUMAN_APPROVED'] },
  { id: 'access', label: 'Access', types: ['PERMISSION_CHANGED', 'DOCUMENT_DOWNLOADED'] },
];

export function Activity() {
  const [active, setActive] = useState<'all' | 'changes' | 'ai' | 'access'>('all');
  const selected = filters.find((filter) => filter.id === active);
  const events =
    !selected || selected.types.length === 0
      ? activityEvents
      : activityEvents.filter((event) => selected.types.includes(event.type));

  return (
    <div className="mx-auto max-w-4xl">
      <header>
        <p className="label-eyebrow text-orange-800">Activity</p>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Audit trail</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
          Events you are authorized to see, newest first. Strictly append-only.
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2">
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
    </div>
  );
}