import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { GitBranchIcon, ShareIcon, ShieldCheckIcon, BotIcon, PlusIcon, FileCodeIcon } from 'lucide-react';
import { ErrorState } from '../components/ErrorState';
import { RestoreDialog } from '../components/RestoreDialog';
import { ShareDialog } from '../components/ShareDialog';
import { HistoryQADialog } from '../components/HistoryQADialog';
import { CreateBranchDialog } from '../components/CreateBranchDialog';
import { ProvenanceBlameDialog } from '../components/ProvenanceBlameDialog';
import { VersionInspector } from '../components/VersionInspector';
import { VersionTimeline } from '../components/VersionTimeline';
import { UploadZone } from '../components/UploadZone';
import { getDocument, getParent, getVersion } from '../utils/documents';
import type { Version } from '../types';

export function DocumentWorkspace() {
  const { documentId } = useParams();
  const initialDoc = getDocument(documentId);
  const [doc, setDoc] = useState(initialDoc);
  const [selectedId, setSelectedId] = useState(doc?.currentVersionId ?? '');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [blameOpen, setBlameOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (!doc) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState variant="unauthorized" />
      </div>
    );
  }

  const version = getVersion(doc, selectedId) ?? doc.versions[doc.versions.length - 1];
  const parent = getParent(doc, version);

  function handleCreateBranch(branchName: string) {
    if (!doc) return;
    const updatedBranches = doc.branches.includes(branchName)
      ? doc.branches
      : [...doc.branches, branchName];
    setDoc({
      ...doc,
      branches: updatedBranches,
    });
    setNotice(`Branch "${branchName}" created from base version ${version.label}.`);
  }

  function handleUploadComplete() {
    if (!doc) return;
    const nextVerNum = doc.versionCount + 1;
    const nextVerId = `v${nextVerNum}`;
    const now = new Date().toISOString();
    const newVersion: Version = {
      id: nextVerId,
      label: `V${nextVerNum}`,
      timestamp: now,
      author: 'Akhand Pratap',
      branch: version.branch,
      status: 'current',
      summary: `Revision uploaded by Akhand Pratap`,
      hash: 'a9f23c8194b19283746192837461928374619283746192837461928374619283',
      source: 'Direct upload',
      parentId: version.id,
      changes: [
        {
          id: `chg_${nextVerId}_1`,
          section: 'Clause 4 · Operational Terms',
          previous: 'Standard SLA',
          current: '99.99% Guaranteed SLA',
          material: true,
          category: 'Operational',
          severity: 'high',
          previousText: 'Standard best-effort SLA applies.',
          currentText: '99.99% uptime SLA with financial penalty credits.',
        },
      ],
    };

    const updatedVersions: Version[] = doc.versions.map((v) =>
      v.id === doc.currentVersionId ? { ...v, status: 'main' as const } : v
    );

    const updatedDoc = {
      ...doc,
      currentVersionId: nextVerId,
      versionCount: nextVerNum,
      updatedAt: now,
      versions: [newVersion, ...updatedVersions],
    };

    setDoc(updatedDoc);
    setSelectedId(nextVerId);
    setUploadOpen(false);
    setNotice(`Version ${newVersion.label} uploaded and verified on ${version.branch}.`);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="label-eyebrow text-orange-800 font-semibold">{doc.reference} · your role: {doc.role}</p>
          <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold text-ink">{doc.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-1.5 font-mono text-xs text-amber-900 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              <GitBranchIcon className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
              {version.branch}
            </span>
            <span>
              Current version <span className="font-mono font-semibold text-ink">{doc.currentVersionId.toUpperCase()}</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-xs font-semibold">
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

      {notice && (
        <p role="status" className="mt-6 rounded-xl bg-orange-100 border border-orange-200 px-4 py-3 text-sm font-medium text-orange-950">
          {notice}
        </p>
      )}

      {uploadOpen && (
        <div className="mt-6">
          <UploadZone onComplete={handleUploadComplete} />
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-[19rem_minmax(0,1fr)]">
        <VersionTimeline doc={doc} selectedVersionId={version.id} onSelect={setSelectedId} />
        <VersionInspector
          doc={doc}
          version={version}
          parent={parent}
          onRestore={() => setRestoreOpen(true)}
        />
      </div>

      {/* Dialogs */}
      <RestoreDialog
        open={restoreOpen}
        version={version}
        onCancel={() => setRestoreOpen(false)}
        onConfirm={() => {
          setRestoreOpen(false);
          const nextVerNum = doc.versionCount + 1;
          const nextVerId = `v${nextVerNum}`;
          const now = new Date().toISOString();
          const restoredVersion: Version = {
            id: nextVerId,
            label: `V${nextVerNum}`,
            timestamp: now,
            author: 'Akhand Pratap',
            branch: version.branch,
            status: 'current',
            summary: `Restored content from ${version.label}`,
            hash: version.hash,
            source: `Restored from ${version.label}`,
            parentId: version.id,
            changes: [],
          };

          const updatedVersions: Version[] = doc.versions.map((v) =>
            v.id === doc.currentVersionId ? { ...v, status: 'main' as const } : v
          );

          setDoc({
            ...doc,
            currentVersionId: nextVerId,
            versionCount: nextVerNum,
            updatedAt: now,
            versions: [restoredVersion, ...updatedVersions],
          });
          setSelectedId(nextVerId);
          setNotice(`${version.label} restored as new immutable version ${restoredVersion.label}. Full history is preserved.`);
        }}
      />

      <ShareDialog open={shareOpen} documentTitle={doc.title} onClose={() => setShareOpen(false)} />
      <HistoryQADialog open={qaOpen} doc={doc} onClose={() => setQaOpen(false)} />
      <CreateBranchDialog open={branchOpen} doc={doc} onClose={() => setBranchOpen(false)} onCreate={handleCreateBranch} />
      <ProvenanceBlameDialog open={blameOpen} doc={doc} version={version} onClose={() => setBlameOpen(false)} />
    </div>
  );
}