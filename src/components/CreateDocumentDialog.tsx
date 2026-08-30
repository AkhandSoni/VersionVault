import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FileTextIcon, PlusIcon, XIcon, ShieldCheckIcon } from 'lucide-react';
import type { DocumentRecord } from '../types';

interface CreateDocumentDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (newDoc: DocumentRecord) => void;
}

export function CreateDocumentDialog({ open, onClose, onCreate }: CreateDocumentDialogProps) {
  const [title, setTitle] = useState('');
  const [reference, setReference] = useState('VA-2026-' + Math.floor(100 + Math.random() * 900));
  const [initialContent, setInitialContent] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setLoading(true);

    setTimeout(() => {
      const docId = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const now = new Date().toISOString();
      const initialVersionId = 'v1';

      const newDoc: DocumentRecord = {
        id: docId,
        reference: reference.trim().toUpperCase(),
        title: title.trim(),
        role: 'Owner',
        branches: ['main'],
        currentVersionId: initialVersionId,
        versionCount: 1,
        updatedAt: now,
        integrity: 'verified',
        reviewNeeded: false,
        versions: [
          {
            id: initialVersionId,
            label: 'V1',
            timestamp: now,
            author: 'Akhand Pratap',
            branch: 'main',
            status: 'current',
            summary: 'Initial draft and baseline contract created',
            hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
            source: 'Manual entry',
            parentId: null,
            changes: [],
          },
        ],
      };

      onCreate(newDoc);
      setLoading(false);
      onClose();
      setTitle('');
      setInitialContent('');
    }, 400);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}>
          
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-doc-title"
            className="relative w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-lift"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
            
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-xs">
                  <FileTextIcon className="h-4 w-4" />
                </span>
                <h2 id="create-doc-title" className="font-serif text-xl font-semibold text-ink">
                  New Document
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-canvas hover:text-ink">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label htmlFor="doc-title" className="label-eyebrow text-ink-muted">
                  Document Title
                </label>
                <input
                  id="doc-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master Services Agreement 2026"
                  className="mt-1.5 w-full rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-ink-muted focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label htmlFor="doc-reference" className="label-eyebrow text-ink-muted">
                  Tracking Reference
                </label>
                <input
                  id="doc-reference"
                  type="text"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5 font-mono text-sm font-medium text-ink focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label htmlFor="doc-content" className="label-eyebrow text-ink-muted">
                  Initial Baseline Content / Notes (Optional)
                </label>
                <textarea
                  id="doc-content"
                  rows={3}
                  value={initialContent}
                  onChange={(e) => setInitialContent(e.target.value)}
                  placeholder="Paste initial agreement clauses or specification text…"
                  className="mt-1.5 w-full rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-orange-50/70 border border-orange-200/80 p-3 text-xs text-orange-950 font-medium">
                <ShieldCheckIcon className="h-4 w-4 text-orange-600 shrink-0" />
                <span>An authoritative <code className="font-mono">main</code> branch and cryptographic <code className="font-mono">V1</code> snapshot will be automatically provisioned.</span>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-line">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-canvas">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!title.trim() || loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2 text-sm font-medium text-white shadow-xs hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 transition-all">
                  <PlusIcon className="h-4 w-4" />
                  {loading ? 'Creating…' : 'Create Document'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
