import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GitBranchIcon, ShareIcon, ShieldCheckIcon } from 'lucide-react';
import { ErrorState } from '../components/ErrorState';
import { RestoreDialog } from '../components/RestoreDialog';
import { ShareDialog } from '../components/ShareDialog';
import { VersionInspector } from '../components/VersionInspector';
import { VersionTimeline } from '../components/VersionTimeline';
import { getDocument, getParent, getVersion } from '../utils/documents';

export function DocumentWorkspace() {
  const { documentId } = useParams();
  const doc = getDocument(documentId);
  const [selectedId, setSelectedId] = useState(doc?.currentVersionId ?? '');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!doc) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState variant="unauthorized" />
      </div>);

  }

  const version = getVersion(doc, selectedId) ?? doc.versions[doc.versions.length - 1];
  const parent = getParent(doc, version);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="label-eyebrow">{doc.reference} · your role: {doc.role}</p>
          <h1 className="mt-1 font-serif text-3xl leading-tight text-ink">{doc.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5">
              <GitBranchIcon className="h-4 w-4" aria-hidden="true" />
              {version.branch}
            </span>
            <span>
              Current version <span className="font-mono text-ink">{doc.currentVersionId.toUpperCase()}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-sage-700">
              <ShieldCheckIcon className="h-4 w-4" aria-hidden="true" />
              Integrity verified
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink transition-colors duration-150 ease-serene hover:bg-sage-50">
            
            <ShareIcon className="h-4 w-4" aria-hidden="true" />
            Share
          </button>
          <Link
            to="/branches"
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink transition-colors duration-150 ease-serene hover:bg-sage-50">
            
            Branches
          </Link>
        </div>
      </header>

      {notice ?
      <p role="status" className="mt-6 rounded-xl bg-sage-50 px-4 py-3 text-sm text-sage-700">
          {notice}
        </p> :
      null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <VersionTimeline doc={doc} selectedVersionId={version.id} onSelect={setSelectedId} />
        <VersionInspector
          doc={doc}
          version={version}
          parent={parent}
          onRestore={() => setRestoreOpen(true)} />
        
      </div>

      <RestoreDialog
        open={restoreOpen}
        version={version}
        onCancel={() => setRestoreOpen(false)}
        onConfirm={() => {
          setRestoreOpen(false);
          setNotice(`${version.label} restored as a new version. Earlier history is unchanged.`);
        }} />
      
      <ShareDialog open={shareOpen} documentTitle={doc.title} onClose={() => setShareOpen(false)} />
    </div>);

}