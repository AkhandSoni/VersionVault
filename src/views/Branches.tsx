import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileTextIcon, GitBranchIcon, PlusIcon } from 'lucide-react';
import { CreateBranchDialog } from '../components/CreateBranchDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useVaultData } from '../lib/vault-data';
import { relativeTime, versionsOnBranch } from '../utils/documents';

export function Branches() {
  const { documents, loading, error, refresh, createBranch } = useVaultData();
  const [selectedDocId, setSelectedDocId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedDoc = documents.find((doc) => doc.id === selectedDocId) ?? documents[0] ?? null;

  async function handleCreateBranch(branchName: string, baseVersionId: string) {
    if (!selectedDoc) return;
    await createBranch(selectedDoc.id, branchName, baseVersionId);
    setNotice(`Branch "${branchName}" created on document "${selectedDoc.title}".`);
  }

  if (loading) {
    return <LoadingState label="Loading branches" rows={5} />;
  }

  if (error) {
    return <ErrorState variant="unavailable" description={error} onRetry={() => void refresh()} />;
  }

  if (documents.length === 0) {
    return (
      <EmptyState
        title="No documents yet"
        description="Create a document and upload at least one version before branching."
        icon={<FileTextIcon className="h-5 w-5" aria-hidden="true" />}
      />
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl" data-testid="page-branches">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="label-eyebrow text-orange-800 font-semibold">Branches</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Parallel lines of work</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
            A branch explores an alternative without touching the recorded history on main.
          </p>
        </div>
        <button
          type="button"
          disabled={!selectedDoc || selectedDoc.versions.length === 0 || selectedDoc.role === 'Viewer'}
          onClick={() => setCreateOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-all hover:from-orange-500 hover:to-amber-500 disabled:from-stone-200 disabled:to-stone-200 disabled:text-stone-500">
          <PlusIcon className="h-4 w-4" />
          Create Branch
        </button>
      </header>

      {notice ? (
        <p role="status" className="mt-6 rounded-xl border border-orange-200 bg-orange-100 px-4 py-3 text-sm font-medium text-orange-950">
          {notice}
        </p>
      ) : null}

      <div className="mt-8 space-y-6">
        {documents.map((doc) => (
          <article key={doc.id} className="min-w-0 overflow-hidden rounded-2xl border border-line bg-surface shadow-xs">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line bg-gradient-to-r from-surface to-orange-50/20 px-6 py-4">
              <div className="min-w-0">
                <p className="label-eyebrow text-ink-muted">{doc.reference}</p>
                <h2 className="mt-0.5 font-serif text-lg font-semibold text-ink">{doc.title}</h2>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={doc.versions.length === 0 || doc.role === 'Viewer'}
                  onClick={() => {
                    setSelectedDocId(doc.id);
                    setCreateOpen(true);
                  }}
                  className="rounded-md border border-orange-200 bg-orange-50 px-2.5 py-1 text-xs font-semibold text-orange-700 hover:text-orange-900 disabled:border-line disabled:bg-canvas disabled:text-ink-muted">
                  + New Branch
                </button>
                <Link
                  to={`/documents/${doc.id}`}
                  className="text-sm font-medium text-ink-muted underline decoration-line underline-offset-4 hover:text-ink">
                  Open workspace
                </Link>
              </div>
            </div>

            <div className="grid gap-px bg-line sm:grid-cols-2" data-testid="branch-graph">
              {doc.branches.map((branch) => {
                const versions = versionsOnBranch(doc, branch);
                const isMain = branch === 'main';
                return (
                  <div key={branch} className="bg-surface px-6 py-5">
                    <p className="flex items-center gap-2 text-sm font-semibold text-ink">
                      <GitBranchIcon
                        className={`h-4 w-4 ${isMain ? 'text-ink-muted' : 'text-orange-600'}`}
                        aria-hidden="true"
                      />
                      {branch}
                      <span className={`ml-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${
                        isMain
                          ? 'border-line bg-canvas text-ink-muted'
                          : 'border-amber-200 bg-amber-100 text-amber-900'
                      }`}>
                        {isMain ? 'authoritative' : 'feature branch'}
                      </span>
                    </p>
                    {versions.length === 0 ? (
                      <p className="mt-4 text-xs text-ink-muted">No versions recorded on this branch yet.</p>
                    ) : (
                      <ol className="mt-4 space-y-3">
                        {[...versions].reverse().map((version) => (
                          <li key={version.id} className="flex items-baseline gap-3">
                            <span className="font-mono text-xs font-semibold text-ink">{version.label}</span>
                            <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">
                              <span className="font-medium text-ink-soft">{version.author}</span> - {relativeTime(version.timestamp)}
                            </span>
                            {version.parentId ? (
                              <Link
                                to={`/documents/${doc.id}/compare/${version.id}`}
                                className="text-xs font-medium text-orange-700 underline decoration-orange-200 underline-offset-4 hover:text-orange-900">
                                Compare
                              </Link>
                            ) : null}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {selectedDoc ? (
        <CreateBranchDialog
          key={`${selectedDoc.id}-${selectedDoc.currentVersionId}-${createOpen}`}
          open={createOpen}
          doc={selectedDoc}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateBranch}
        />
      ) : null}
    </div>
  );
}
