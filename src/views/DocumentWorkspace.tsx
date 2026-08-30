import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { BotIcon, FileCodeIcon, GitBranchIcon, PlusIcon, ShareIcon, ShieldCheckIcon, Trash2Icon } from 'lucide-react';
import { CreateBranchDialog } from '../components/CreateBranchDialog';
import { DeleteDocumentDialog } from '../components/DeleteDocumentDialog';
import { AIProposalCard } from '../components/AIProposalCard';
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
import * as api from '../lib/api-client';
import type { AIProposal } from '../types';

export function DocumentWorkspace() {
  const { documentId } = useParams();
  const navigate = useNavigate();
  const { documents, loading, error, refresh, refreshDocument, uploadRevision, restoreRevision, createBranch, deleteDocument } = useVaultData();
  const doc = getDocument(documents, documentId);
  const authorizedDocumentId = doc?.id;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState('');
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const [branchOpen, setBranchOpen] = useState(false);
  const [blameOpen, setBlameOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [restoreKey, setRestoreKey] = useState<string | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [proposals, setProposals] = useState<api.ApiProposal[]>([]);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  React.useEffect(() => {
    if (!authorizedDocumentId) return;
    let active = true;
    void api.listProposals(authorizedDocumentId)
      .then((items) => {
        if (active) {
          setProposalError(null);
          setProposals(items);
        }
      })
      .catch((error) => {
        if (active) {
          setProposals([]);
          setProposalError(error instanceof Error ? error.message : 'Could not load AI proposals.');
        }
      });
    return () => {
      active = false;
    };
  }, [authorizedDocumentId]);

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
  const branchDetails = activeDoc.branchDetails ?? [];
  const selectedVersion = getVersion(activeDoc, selectedId);
  const fallbackVersion = getVersion(activeDoc, activeDoc.currentVersionId) ?? activeDoc.versions[0];
  const requestedBranch = searchParams.get('branch');
  const branchName = requestedBranch && activeDoc.branches.includes(requestedBranch)
    ? requestedBranch
    : fallbackVersion?.branch ?? activeDoc.branches[0] ?? 'main';
  const branch = branchDetails.find((item) => item.name === branchName);
  const canEdit = activeDoc.role !== 'Viewer';
  const canManagePermissions = activeDoc.role === 'Owner';
  const branchVersionIds = new Set(
    activeDoc.versions
      .filter((item) => item.branch === branchName || item.id === branch?.baseVersionId)
      .map((item) => item.id),
  );
  const branchHead = getVersion(activeDoc, branch?.headVersionId ?? undefined)
    ?? getVersion(activeDoc, branch?.baseVersionId ?? undefined)
    ?? activeDoc.versions.find((item) => item.branch === branchName);
  const version = selectedVersion && branchVersionIds.has(selectedVersion.id)
    ? selectedVersion
    : branchHead ?? fallbackVersion;
  const parent = getParent(activeDoc, version);

  function handleBranchChange(nextBranchName: string) {
    const nextBranch = branchDetails.find((item) => item.name === nextBranchName);
    const nextHead = getVersion(activeDoc, nextBranch?.headVersionId ?? undefined)
      ?? getVersion(activeDoc, nextBranch?.baseVersionId ?? undefined)
      ?? activeDoc.versions.find((item) => item.branch === nextBranchName);
    setSelectedId(nextHead?.id ?? '');
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('branch', nextBranchName);
      return next;
    });
  }

  async function reviewProposal(proposalId: string, action: 'approve' | 'reject') {
    await api.reviewProposal(proposalId, action, crypto.randomUUID());
    setProposals(await api.listProposals(activeDoc.id));
    await refreshDocument(activeDoc.id);
  }

  function toUiProposal(proposal: api.ApiProposal): AIProposal {
    const proposalBranch = branchDetails.find((branchDetail) => branchDetail.id === proposal.branchId)?.name;
    return {
      id: proposal.id,
      documentId: proposal.documentId,
      branch: proposalBranch || 'document branch',
      section: proposal.taskDescription || 'Proposed document change',
      proposed: proposal.proposedContent,
      rationale: proposal.taskDescription || 'AI-generated proposal grounded in the selected source version.',
      approval: proposal.approvalStatus.toLowerCase() as AIProposal['approval'],
      createdAt: proposal.createdAt,
    };
  }

  async function handleCreateBranch(branchName: string, baseVersionId: string) {
    const created = await createBranch(activeDoc.id, branchName, baseVersionId, crypto.randomUUID());
    setSelectedId(created.headVersionId ?? created.baseVersionId ?? '');
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('branch', created.name);
      return next;
    });
    setNotice(`Branch "${created.name}" is active and starts at the selected base version.`);
  }

  async function handleUploadComplete(file: File, message?: string, idempotencyKey?: string) {
    const branchId = branchDetails.find((item) => item.name === branchName)?.id;
    await uploadRevision(activeDoc.id, file, message, branchId, idempotencyKey);
    setUploadOpen(false);
    setNotice('Revision uploaded and verified. The newest version is now available for review.');
  }

  async function handleRestore() {
    if (!version) return;
    setRestoreError(null);
    const key = restoreKey || crypto.randomUUID();
    setRestoreKey(key);
    try {
      await restoreRevision(version.id, `Restored from ${version.label}`, branch?.id, key);
      setRestoreOpen(false);
      setNotice(`${version.label} restored as a new immutable version on ${branchName}. Full history is preserved.`);
    } catch (error) {
      setRestoreError(error instanceof Error ? error.message : 'Could not restore this version.');
    } finally {
      setRestoreKey(null);
    }
  }

  async function handlePermanentDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteDocument(activeDoc.id);
      setDeleteOpen(false);
      navigate('/documents', { replace: true });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Could not permanently delete this document.');
    } finally {
      setDeleting(false);
    }
  }

  if (!version) {
    return (
      <div className="mx-auto max-w-6xl" data-testid="page-document">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
          <div>
            <p className="label-eyebrow text-orange-800 font-semibold">{activeDoc.reference} - your role: {activeDoc.role}</p>
            <h1 className="mt-1 font-serif text-3xl leading-tight font-semibold text-ink">{activeDoc.title}</h1>
            <p className="mt-2 text-sm text-ink-muted">Upload an initial revision to create the first immutable version.</p>
          </div>
        </header>
        {canEdit ? (
          <div className="mt-6">
            <UploadZone onComplete={handleUploadComplete} />
          </div>
        ) : (
          <p className="mt-6 rounded-xl border border-line bg-canvas px-4 py-3 text-sm text-ink-muted">
            This document is empty and you have read-only access. An owner or editor must upload its first revision.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl" data-testid="page-document">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="label-eyebrow text-orange-800 font-semibold">{activeDoc.reference} - your role: {activeDoc.role}</p>
            <h1 id="document-title" className="mt-1 font-serif text-3xl leading-tight font-semibold text-ink">{activeDoc.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-ink-muted">
            <label className="inline-flex items-center gap-1.5 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-xs text-amber-900">
              <GitBranchIcon className="h-3.5 w-3.5 text-amber-700" aria-hidden="true" />
              <span className="sr-only">Active branch</span>
              <select
                aria-label="Active branch"
                value={branchName}
                onChange={(event) => handleBranchChange(event.target.value)}
                className="bg-transparent font-mono text-xs font-semibold text-amber-900 outline-none">
                {activeDoc.branches.map((name) => {
                  const detail = branchDetails.find((item) => item.name === name);
                  const head = getVersion(activeDoc, detail?.headVersionId ?? undefined);
                  return <option key={name} value={name}>{name}{name === 'main' ? ' · authoritative' : ` · ${head?.label ?? 'base'}`}</option>;
                })}
              </select>
              <span id="document-branch" className="sr-only">{branchName}</span>
            </label>
            <span>
              Viewing <span id="document-current-version" className="font-mono font-semibold text-ink">{version.label}</span>
            </span>
            <span>
              <span className="font-mono">{branchName}</span> HEAD <span className="font-mono font-semibold text-ink">{branchHead?.label ?? '—'}</span>
            </span>
            {branchName !== 'main' ? (
              <span className="text-xs text-ink-muted">
                Authoritative main: <span className="font-mono font-semibold text-ink">{fallbackVersion?.label ?? '—'}</span>
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5 rounded border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-800">
              <ShieldCheckIcon className="h-3.5 w-3.5 text-emerald-600" aria-hidden="true" />
              <span id="document-status">Integrity verified</span>
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
          {canEdit ? (
            <>
              <button
                type="button"
                onClick={() => setBranchOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas">
                <GitBranchIcon className="h-4 w-4 text-ink-muted" />
                New Branch
              </button>
              {canManagePermissions ? (
                <>
                  <button
                    type="button"
                    onClick={() => setShareOpen(true)}
                    className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas">
                    <ShareIcon className="h-4 w-4 text-ink-muted" />
                    Share
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDeleteError(null); setDeleteOpen(true); }}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-sm font-semibold text-rose-700 transition-colors hover:bg-rose-100">
                    <Trash2Icon className="h-4 w-4" />
                    Delete
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setUploadOpen(!uploadOpen)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-3.5 py-2 text-sm font-medium text-white shadow-xs hover:from-orange-500 hover:to-amber-500">
                <PlusIcon className="h-4 w-4" />
                Upload Revision
              </button>
            </>
          ) : (
            <span className="inline-flex items-center rounded-lg border border-line bg-canvas px-3.5 py-2 text-sm font-medium text-ink-muted">
              Read-only access
            </span>
          )}
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
        <VersionTimeline
          doc={activeDoc}
          branchName={branchName}
          selectedVersionId={version.id}
          onSelect={setSelectedId}
        />
          <VersionInspector doc={activeDoc} version={version} parent={parent} canEdit={canEdit} onRestore={() => setRestoreOpen(true)} />
      </div>

      {proposals.length > 0 || proposalError ? (
        <section className="mt-8 space-y-4" aria-labelledby="proposals-heading">
          <div>
            <p className="label-eyebrow text-orange-800">Human decision gate</p>
            <h2 id="proposals-heading" className="mt-1 font-serif text-2xl font-semibold text-ink">AI proposals stay outside history until approved</h2>
            {proposalError ? <p className="mt-2 text-sm text-ink-muted">{proposalError}</p> : null}
          </div>
          {proposals.map((proposal) => (
            <AIProposalCard
              key={proposal.id}
              proposal={toUiProposal(proposal)}
              canEdit={canEdit}
              onApprove={(proposalId) => reviewProposal(proposalId, 'approve')}
              onReject={(proposalId) => reviewProposal(proposalId, 'reject')}
            />
          ))}
        </section>
      ) : null}

      <RestoreDialog
        open={restoreOpen}
        version={version}
        branchName={branchName}
        restoring={Boolean(restoreKey)}
        error={restoreError}
        onCancel={() => setRestoreOpen(false)}
        onConfirm={() => void handleRestore()}
      />
      <ShareDialog
        open={shareOpen}
        documentId={activeDoc.id}
        documentTitle={activeDoc.title}
        onClose={() => setShareOpen(false)}
      />
      <DeleteDocumentDialog
        open={deleteOpen}
        documentTitle={activeDoc.title}
        deleting={deleting}
        error={deleteError}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handlePermanentDelete()}
      />
      <HistoryQADialog open={qaOpen} doc={activeDoc} onClose={() => setQaOpen(false)} />
      <CreateBranchDialog key={`${activeDoc.id}-${activeDoc.currentVersionId}-${branchOpen}`} open={branchOpen} doc={activeDoc} onClose={() => setBranchOpen(false)} onCreate={handleCreateBranch} />
      <ProvenanceBlameDialog open={blameOpen} doc={activeDoc} version={version} onClose={() => setBlameOpen(false)} />
    </div>
  );
}
