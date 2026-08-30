import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangleIcon, Trash2Icon } from 'lucide-react';

interface DeleteDocumentDialogProps {
  open: boolean;
  documentTitle: string;
  deleting?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteDocumentDialog({
  open,
  documentTitle,
  deleting = false,
  error,
  onCancel,
  onConfirm,
}: DeleteDocumentDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const canConfirm = confirmation.trim() === documentTitle.trim() && !deleting;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-ink/30 backdrop-blur-xs" onClick={deleting ? undefined : onCancel} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-document-title"
            data-testid="delete-document-dialog"
            className="relative w-full max-w-md rounded-2xl border border-rose-200 bg-surface p-6 shadow-lift"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}>
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                <AlertTriangleIcon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h2 id="delete-document-title" className="font-serif text-xl font-semibold text-ink">
                  Permanently delete document?
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  This permanently removes <span className="font-semibold text-ink">{documentTitle}</span>, every version, branch, proposal, and stored file. This cannot be undone.
                </p>
              </div>
            </div>

            <label htmlFor="delete-document-confirmation" className="mt-5 block text-xs font-semibold text-ink-muted">
              Type <span className="font-mono text-ink">{documentTitle}</span> to confirm
            </label>
            <input
              id="delete-document-confirmation"
              autoFocus
              value={confirmation}
              onChange={(event) => setConfirmation(event.target.value)}
              disabled={deleting}
              className="mt-2 w-full rounded-lg border border-line bg-canvas px-3 py-2.5 text-sm text-ink focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />

            {error ? (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-800" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3 border-t border-line pt-4">
              <button type="button" onClick={onCancel} disabled={deleting} className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink hover:bg-canvas">
                Cancel
              </button>
              <button
                type="button"
                data-testid="delete-document-confirm"
                onClick={onConfirm}
                disabled={!canConfirm}
                className="inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">
                <Trash2Icon className="h-4 w-4" aria-hidden="true" />
                {deleting ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
