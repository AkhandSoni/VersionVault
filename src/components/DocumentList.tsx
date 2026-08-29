import React from 'react';
import { Link } from 'react-router-dom';
import { FileTextIcon, ShieldCheckIcon } from 'lucide-react';
import { relativeTime } from '../utils/documents';
import type { DocumentRecord } from '../types';

interface DocumentListProps {
  documents: DocumentRecord[];
  view?: 'list' | 'grid';
}

export function DocumentList({ documents, view = 'list' }: DocumentListProps) {
  if (view === 'grid') {
    return (
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {documents.map((doc) =>
        <li key={doc.id} className="flex">
            <Link
            to={`/documents/${doc.id}`}
            className="flex w-full flex-col rounded-2xl border border-line bg-surface p-5 transition-colors duration-150 ease-serene hover:border-sage-200">
            
              <span className="label-eyebrow">{doc.reference}</span>
              <span className="mt-1.5 font-serif text-lg leading-snug text-ink">{doc.title}</span>
              <span className="mt-2 text-xs text-ink-muted">
                {doc.versionCount} versions · updated {relativeTime(doc.updatedAt)}
              </span>
              <span className="mt-auto flex items-center gap-2 pt-4 text-xs text-ink-muted">
                <ShieldCheckIcon className="h-3.5 w-3.5 text-sage-600" aria-hidden="true" />
                {doc.role} · {doc.branches.length} branch{doc.branches.length > 1 ? 'es' : ''}
              </span>
            </Link>
          </li>
        )}
      </ul>);

  }

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
      {documents.map((doc) =>
      <li key={doc.id}>
          <Link
          to={`/documents/${doc.id}`}
          className="flex flex-wrap items-center gap-4 px-5 py-4 transition-colors duration-150 ease-serene hover:bg-canvas">
          
            <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-sage-50 text-sage-600">
            
              <FileTextIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm text-ink">{doc.title}</span>
              <span className="block text-xs text-ink-muted">
                {doc.reference} · {doc.versionCount} versions · updated {relativeTime(doc.updatedAt)}
              </span>
            </span>
            {doc.reviewNeeded ?
          <span className="rounded-full bg-clay-50 px-2.5 py-1 text-xs text-clay-700">
                Review needed
              </span> :
          null}
            <span className="w-16 text-right text-xs text-ink-muted">{doc.role}</span>
          </Link>
        </li>
      )}
    </ul>);

}