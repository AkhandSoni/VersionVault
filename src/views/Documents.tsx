import React from 'react';
import { DocumentList } from '../components/DocumentList';
import { UploadZone } from '../components/UploadZone';
import { documents } from '../data/documents';

interface DocumentsProps {
  documentView?: 'list' | 'grid';
}

export function Documents({ documentView = 'list' }: DocumentsProps) {
  return (
    <div className="mx-auto max-w-6xl">
      <header>
        <p className="label-eyebrow">Documents</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Authorized documents</h1>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-ink-muted">
          Only documents your account has access to are returned here.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <DocumentList documents={documents} view={documentView} />
        <UploadZone />
      </div>
    </div>);

}