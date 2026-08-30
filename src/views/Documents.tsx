import React, { useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { DocumentList } from '../components/DocumentList';
import { UploadZone } from '../components/UploadZone';
import { CreateDocumentDialog } from '../components/CreateDocumentDialog';
import { documents as initialDocuments } from '../data/documents';
import type { DocumentRecord } from '../types';

interface DocumentsProps {
  documentView?: 'list' | 'grid';
}

export function Documents({ documentView = 'list' }: DocumentsProps) {
  const [docList, setDocList] = useState<DocumentRecord[]>(initialDocuments);
  const [createOpen, setCreateOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  function handleCreate(newDoc: DocumentRecord) {
    setDocList((prev) => [newDoc, ...prev]);
    setNotice(`Document "${newDoc.title}" (${newDoc.reference}) created with initial V1 snapshot.`);
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-eyebrow text-orange-800 font-semibold">Documents</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Authorized documents</h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
            Only documents your account has access to are returned here.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs hover:from-orange-500 hover:to-amber-500 transition-all">
          <PlusIcon className="h-4 w-4" />
          New Document
        </button>
      </header>

      {notice && (
        <p role="status" className="mt-6 rounded-xl bg-orange-100 border border-orange-200 px-4 py-3 text-sm font-medium text-orange-950">
          {notice}
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <DocumentList documents={docList} view={documentView} />
        <UploadZone onComplete={() => setNotice('Revision uploaded. Cryptographic hash recorded.')} />
      </div>

      <CreateDocumentDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  );
}