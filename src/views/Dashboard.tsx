import React from 'react';
import { Link } from 'react-router-dom';
import { FileTextIcon, PlusIcon } from 'lucide-react';
import { DocumentList } from '../components/DocumentList';
import { EmptyState } from '../components/EmptyState';
import { MaterialChangeBadge } from '../components/MaterialChangeBadge';
import { documents } from '../data/documents';
import { materialChanges, relativeTime } from '../utils/documents';

interface DashboardProps {
  documentView?: 'list' | 'grid';
}

export function Dashboard({ documentView = 'list' }: DashboardProps) {
  const changes = materialChanges().slice(0, 4);
  const reviews = documents.filter((doc) => doc.reviewNeeded).length;
  const versions = documents.reduce((total, doc) => total + doc.versionCount, 0);

  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        description="Create your first document to start building an immutable history."
        icon={<FileTextIcon className="h-5 w-5" aria-hidden="true" />}
        action={
        <Link
          to="/documents"
          className="inline-flex items-center gap-2 rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-medium text-white">
          
            <PlusIcon className="h-4 w-4" aria-hidden="true" />
            New document
          </Link>
        } />);


  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-eyebrow">Overview</p>
          <h1 className="mt-1 font-serif text-3xl text-ink">Recent material changes</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
            Changes that alter an obligation, a number, or a date. Everything else stays out of the
            way.
          </p>
        </div>
        <dl className="flex gap-8">
          <div>
            <dt className="label-eyebrow">Documents</dt>
            <dd className="mt-0.5 font-serif text-2xl text-ink">{documents.length}</dd>
          </div>
          <div>
            <dt className="label-eyebrow">Versions</dt>
            <dd className="mt-0.5 font-serif text-2xl text-ink">{versions}</dd>
          </div>
          <div>
            <dt className="label-eyebrow">Reviews needed</dt>
            <dd className="mt-0.5 font-serif text-2xl text-clay-600">{reviews}</dd>
          </div>
        </dl>
      </header>

      <ul className="mt-8 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
        {changes.map(({ doc, version, change }) =>
        <li key={change.id}>
            <Link
            to={`/documents/${doc.id}/compare/${version.id}`}
            className="flex flex-col gap-4 px-6 py-5 transition-colors duration-150 ease-serene hover:bg-canvas sm:flex-row sm:items-center">
            
              <span className="min-w-0 flex-1">
                <span className="label-eyebrow">
                  {doc.reference} · {version.label} · {version.branch}
                </span>
                <span className="mt-1 block font-serif text-lg text-ink">{change.section}</span>
                <span className="mt-1 flex flex-wrap items-baseline gap-2 text-sm">
                  <span className="text-ink-muted line-through decoration-1">{change.previous}</span>
                  <span aria-hidden="true" className="text-ink-muted">→</span>
                  <span className="text-ink">{change.current}</span>
                </span>
              </span>
              <span className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                <MaterialChangeBadge
                category={change.category}
                severity={change.severity}
                material={change.material} />
              
                <span className="text-xs text-ink-muted">
                  {version.author} · {relativeTime(version.timestamp)}
                </span>
              </span>
            </Link>
          </li>
        )}
      </ul>

      <section className="mt-12" aria-labelledby="recent-docs">
        <div className="flex items-end justify-between gap-4">
          <h2 id="recent-docs" className="font-serif text-xl text-ink">
            Your documents
          </h2>
          <Link
            to="/documents"
            className="text-sm text-sage-700 underline decoration-sage-200 underline-offset-4">
            
            View all
          </Link>
        </div>
        <div className="mt-4">
          <DocumentList documents={documents} view={documentView} />
        </div>
      </section>
    </div>);

}