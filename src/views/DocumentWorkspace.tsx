import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { BotIcon, FileCodeIcon, GitBranchIcon, PlusIcon, ShareIcon, ShieldCheckIcon } from 'lucide-react';
import { CreateBranchDialog } from '../components/CreateBranchDialog';
import { ErrorState } from '../components/ErrorState';
import { HistoryQADialog } from '../components/HistoryQADialog';
import { LoadingState } from '../components/LoadingState';
import { ProvenanceBlameDialog } from '../components/ProvenanceBlameDialog';
import { RestoreDialog } from '../components/RestoreDialog';
import { ShareDialog } from '../components/ShareDialog';
import { UploadZone } from '../components/UploadZone';
import { VersionInspector } from '../components/VersionInspector';
import { VersionTimeline } from '../components/VersionTimeline';
import { useVaultData } from '../lib/vault-data';
import { getDocument, getParent, getVersion } from '../utils/documents';

export function DocumentWorkspace() {
  const { documentId } = useParams();
  const { documents, loading, error, refresh, uploadRevision, restoreRevision, createBranch } = useVaultData();
  const doc = getDocument(documents, documentId);
  const [selectedId, setSelectedId] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [blameOpen, setBlameOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (loading) {
    return <LoadingState label="Loading document workspace" rows={5} />;
  }

  if (error) {
    return <ErrorState variant="unavailable" description={error} onRetry={() => void refresh()} />;
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState variant="unauthorized" />
      </div>
    );
  }

  const activeDoc = doc;
  const version = getVersion(activeDoc, selectedId) ?? getVersion(activeDoc, activeDoc.currentVersionId) ?? activeDoc.versions[0];
  const parent = getParent(activeDoc, version);

  async function handleCreateBranch(branchName: string, baseVersionId: string) {
    await createBranch(activeDoc.id, branchName, baseVersionId);
    setNotice(`Branch "${branchName}" created from the selected base version.`);
  }

  async function handleUploadComplete(file: File, message?: string) {
    await uploadRevision(activeDoc.id, file, message);
    setUploadOpen(false);
    setNotice('Revision uploaded and verified. The newest version is now available for review.');
  }

  async function handleRestore() {
    if (!version) return;
    setRestoreOpen(false);
    await restoreRevision(version.id, `Restored from ${version.label}`);
    setNotice(`${version.label} restored as a new immutable version. Full history is preserved.`);
  }

  if (!version) {
    return (
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="label-eyebrow text-orange-800 font-semibold">{activeDoc.reference} - your role: {activeDoc.role}</p>
            <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold text-ink">{activeDoc.title}</h1>
            <p className="mt-2 text-sm text-ink-muted">Upload an initial revision to create the first immutable version.</p>
          </div>
        </header>
        <div className="mt-6">
          <UploadZone onComplete={handleUploadComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="label-eyebrow text-orange-800 font-semibold">{activeDoc.reference} - your role: {activeDoc.role}</p>
          <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold text-ink">{activeDoc.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-xs text-amber-900">
              <GitBranchIcon className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
              {version.branch}
            </span>
            <span>
              Current version <span className="font-mono font-semibold text-ink">{version.label}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              Integrity verified
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setQaOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3.5 py-2 text-sm font-semibold text-orange-950 shadow-xs transition-colors hover:bg-orange-100">
            <BotIcon className="h-4 w-4 text-orange-600" />
            Ask History AI
          </button>
          <button
            type="button"
            onClick={() => setBlameOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas">
            <FileCodeIcon className="h-4 w-4 text-ink-muted" />
            Line Blame
          </button>
          <button
            type="button"
            onClick={() => setBranchOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas">
            <GitBranchIcon className="h-4 w-4 text-ink-muted" />
            New Branch
          </button>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas">
            <ShareIcon className="h-4 w-4 text-ink-muted" />
            Share
          </button>
          <button
            type="button"
            onClick={() => setUploadOpen(!uploadOpen)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-3.5 py-2 text-sm font-medium text-white shadow-xs hover:from-orange-500 hover:to-amber-500">
            <PlusIcon className="h-4 w-4" />
            Upload Revision
          </button>
        </div>
      </header>

      {notice ? (
        <p role="status" className="mt-6 rounded-xl border border-orange-200 bg-orange-100 px-4 py-3 text-sm font-medium text-orange-950">
          {notice}
        </p>
      ) : null}

      {uploadOpen ? (
        <div className="mt-6">
          <UploadZone onComplete={handleUploadComplete} />
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <VersionTimeline doc={activeDoc} selectedVersionId={version.id} onSelect={setSelectedId} />
        <VersionInspector doc={activeDoc} version={version} parent={parent} onRestore={() => setRestoreOpen(true)} />
      </div>

      <RestoreDialog
        open={restoreOpen}
        version={version}
        onCancel={() => setRestoreOpen(false)}
        onConfirm={() => void handleRestore()}
      />
      <ShareDialog
        open={shareOpen}
        documentId={activeDoc.id}
        documentTitle={activeDoc.title}
        onClose={() => setShareOpen(false)}
      />
      <HistoryQADialog open={qaOpen} doc={activeDoc} onClose={() => setQaOpen(false)} />
      <CreateBranchDialog open={branchOpen} doc={activeDoc} onClose={() => setBranchOpen(false)} onCreate={handleCreateBranch} />
      <ProvenanceBlameDialog open={blameOpen} doc={activeDoc} version={version} onClose={() => setBlameOpen(false)} />
    </div>
  );
}
