import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { GitBranchIcon, PlusIcon } from 'lucide-react';
import { documents as initialDocuments } from '../data/documents';
import { relativeTime, versionsOnBranch } from '../utils/documents';
import { CreateBranchDialog } from '../components/CreateBranchDialog';
import type { DocumentRecord } from '../types';

export function Branches() {
  const [docList, setDocList] = useState<DocumentRecord[]>(initialDocuments);
  const [selectedDoc, setSelectedDoc] = useState<DocumentRecord>(initialDocuments[0]);
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const branched = docList.filter((doc) => doc.branches.length > 1);

  function handleCreateBranch(branchName: string) {
    if (!selectedDoc) return;
    const updated = docList.map((d) => {
      if (d.id === selectedDoc.id) {
        return {
          ...d,
          branches: d.branches.includes(branchName) ? d.branches : [...d.branches, branchName],
        };
      }
      return d;
    });
    setDocList(updated);
    setNotice(`Branch "${branchName}" created on document "${selectedDoc.title}".`);
  }

  return (
    <div className="mx-auto max-w-5xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-eyebrow text-orange-800 font-semibold">Branches</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Parallel lines of work</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
            A branch explores an alternative without touching the recorded history on main.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setSelectedDoc(docList[0]);
            setCreateOpen(true);
          }}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:from-orange-500 hover:to-amber-500 transition-all">
          <PlusIcon className="h-4 w-4" />
          Create Branch
        </button>
      </header>

      {notice && (
        <p role="status" className="mt-6 rounded-xl bg-orange-100 border border-orange-200 px-4 py-3 text-sm font-medium text-orange-950">
          {notice}
        </p>
      )}

      <div className="mt-8 space-y-6">
        {branched.map((doc) => (
          <article key={doc.id} className="rounded-2xl border border-line bg-surface shadow-xs overflow-hidden">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-6 py-4 bg-gradient-to-r from-surface to-orange-50/20">
              <div>
                <p className="label-eyebrow text-ink-muted">{doc.reference}</p>
                <h2 className="mt-0.5 font-serif text-lg font-semibold text-ink">{doc.title}</h2>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedDoc(doc);
                    setCreateOpen(true);
                  }}
                  className="text-xs font-semibold text-orange-700 hover:text-orange-900 border border-orange-200 bg-orange-50 px-2.5 py-1 rounded-md">
                  + New Branch
                </button>
                <Link
                  to={`/documents/${doc.id}`}
                  className="text-sm font-medium text-ink-muted hover:text-ink underline decoration-line underline-offset-4">
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
                      {isMain ? (
                        <span className="ml-1 rounded-full bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-ink-muted border border-line">
                          authoritative
                        </span>
                      ) : (
                        <span className="ml-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900 border border-amber-200">
                          feature branch
                        </span>
                      )}
                    </p>
                    <ol className="mt-4 space-y-3">
                      {[...versions].reverse().map((version) => (
                        <li key={version.id} className="flex items-baseline gap-3">
                          <span className="font-mono text-xs font-semibold text-ink">{version.label}</span>
                          <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">
                            <span className="font-medium text-ink-soft">{version.author}</span> · {relativeTime(version.timestamp)}
                          </span>
                          {version.parentId ? (
                            <Link
                              to={`/documents/${doc.id}/compare/${version.id}`}
                              className="text-xs font-medium text-orange-700 hover:text-orange-900 underline decoration-orange-200 underline-offset-4">
                              Compare
                            </Link>
                          ) : null}
                        </li>
                      ))}
                    </ol>
                  </div>
                );
              })}
            </div>
          </article>
        ))}
      </div>

      {selectedDoc && (
        <CreateBranchDialog
          open={createOpen}
          doc={selectedDoc}
          onClose={() => setCreateOpen(false)}
          onCreate={handleCreateBranch}
        />
      )}
    </div>
  );
}