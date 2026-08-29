import React from 'react';
import { Link } from 'react-router-dom';
import { GitBranchIcon } from 'lucide-react';
import { documents } from '../data/documents';
import { relativeTime, versionsOnBranch } from '../utils/documents';

export function Branches() {
  const branched = documents.filter((doc) => doc.branches.length > 1);

  return (
    <div className="mx-auto max-w-5xl">
      <header>
        <p className="label-eyebrow">Branches</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Parallel lines of work</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
          A branch explores an alternative without touching the recorded history on main.
        </p>
      </header>

      <div className="mt-8 space-y-6">
        {branched.map((doc) =>
        <article key={doc.id} className="rounded-2xl border border-line bg-surface">
            <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line px-6 py-4">
              <div>
                <p className="label-eyebrow">{doc.reference}</p>
                <h2 className="mt-0.5 font-serif text-lg text-ink">{doc.title}</h2>
              </div>
              <Link
              to={`/documents/${doc.id}`}
              className="text-sm text-sage-700 underline decoration-sage-200 underline-offset-4">
              
                Open workspace
              </Link>
            </div>

            <div className="grid gap-px bg-line sm:grid-cols-2" data-testid="branch-graph">
              {doc.branches.map((branch) => {
              const versions = versionsOnBranch(doc, branch);
              const isMain = branch === 'main';
              return (
                <div key={branch} className="bg-surface px-6 py-5">
                    <p className="flex items-center gap-2 text-sm font-medium text-ink">
                      <GitBranchIcon
                      className={`h-4 w-4 ${isMain ? 'text-ink-muted' : 'text-slate2-600'}`}
                      aria-hidden="true" />
                    
                      {branch}
                      {isMain ?
                    <span className="ml-1 rounded-full bg-canvas px-2 py-0.5 text-[11px] text-ink-muted">
                          authoritative
                        </span> :
                    null}
                    </p>
                    <ol className="mt-4 space-y-3">
                      {[...versions].reverse().map((version) =>
                    <li key={version.id} className="flex items-baseline gap-3">
                          <span className="font-mono text-xs text-ink">{version.label}</span>
                          <span className="min-w-0 flex-1 truncate text-xs text-ink-muted">
                            {version.author} · {relativeTime(version.timestamp)}
                          </span>
                          {version.parentId ?
                      <Link
                        to={`/documents/${doc.id}/compare/${version.id}`}
                        className="text-xs text-sage-700 underline decoration-sage-200 underline-offset-4">
                        
                              Compare
                            </Link> :
                      null}
                        </li>
                    )}
                    </ol>
                  </div>);

            })}
            </div>
          </article>
        )}
      </div>
    </div>);

}