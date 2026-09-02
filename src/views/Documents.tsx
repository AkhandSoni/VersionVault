import React, { useState } from 'react';
import { FileTextIcon, PlusIcon } from 'lucide-react';
import { DocumentList } from '../components/DocumentList';
import { UploadZone } from '../components/UploadZone';
import { CreateDocumentDialog } from '../components/CreateDocumentDialog';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { LoadingState } from '../components/LoadingState';
import { useVaultData } from '../lib/vault-data';

interface DocumentsProps {
  documentView?: 'list' | 'grid';
}

export function Documents({ documentView = 'list' }: DocumentsProps) {
  const { documents, loading, error, createDocument, uploadRevision, refresh, memberships, tenantId } = useVaultData();
  const canCreate = memberships.find((membership) => membership.tenantId === tenantId)?.role !== 'VIEWER';
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedDocId, setSelectedDocId] = useState('');
  const activeDocumentId = documents.some((doc) => doc.id === selectedDocId)
    ? selectedDocId
    : documents[0]?.id ?? '';

  async function handleCreate(title: string, initialContent?: string) {
    await createDocument(title, initialContent);
    setNotice(`Document "${title}" created in your authorized workspace.`);
  }

  async function handleUpload(file: File, message?: string, idempotencyKey?: string) {
    if (!activeDocumentId) throw new Error('Choose a document before uploading a revision.');
    await uploadRevision(activeDocumentId, file, message, undefined, idempotencyKey);
    const doc = documents.find((item) => item.id === activeDocumentId);
    setNotice(`Revision uploaded${doc ? ` to "${doc.title}"` : ''}. Cryptographic hash recorded.`);
  }

  if (loading) {
    return <LoadingState label="Loading documents" rows={5} />;
  }

  if (error) {
    return <ErrorState variant="unavailable" description={error} onRetry={() => void refresh()} />;
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="label-eyebrow text-orange-800 font-semibold">Documents</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Authorized documents</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
            Only documents your account has access to are returned here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          disabled={!canCreate}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-all hover:from-orange-500 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-60">
          <PlusIcon className="h-4 w-4" />
          New Document
        </button>
      </header>

      {notice && (
        <p role="status" className="mt-6 rounded-xl bg-orange-100 border border-orange-200 px-4 py-3 text-sm font-medium text-orange-950">
          {notice}
        </p>
      )}

      {documents.length === 0 ? (
        <div className="mt-8">
          <EmptyState
            title="No documents yet"
            description="Create a document before uploading revisions."
            icon={<FileTextIcon className="h-5 w-5" aria-hidden="true" />}
          />
        </div>
      ) : (
        <div className="mt-8 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
          <DocumentList documents={documents} view={documentView} />
          <div className="min-w-0 space-y-3">
            <label htmlFor="revision-document" className="label-eyebrow text-ink-muted">
              Revision target
            </label>
            <select
              id="revision-document"
              value={activeDocumentId}
              onChange={(event) => setSelectedDocId(event.target.value)}
              className="w-full rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink focus:border-orange-500 focus:outline-none">
              {documents.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title}
                </option>
              ))}
            </select>
            <UploadZone onComplete={handleUpload} />
          </div>
        </div>
      )}

        <CreateDocumentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}
