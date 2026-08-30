import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { InfoIcon, RotateCcwIcon } from 'lucide-react';
import type { Version } from '../types';

interface RestoreDialogProps {
  open: boolean;
  version?: Version;
  branchName?: string;
  restoring?: boolean;
  error?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RestoreDialog({ open, version, branchName, restoring = false, error, onCancel, onConfirm }: RestoreDialogProps) {
  return (
    <AnimatePresence>
      {open && version ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}>
          
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-xs" onClick={onCancel} aria-hidden="true" />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="restore-title"
            data-testid="restore-dialog"
            className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lift"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
            
            <h2 id="restore-title" className="font-serif text-xl font-semibold text-ink">
              Restore{' '}
              <span data-testid="restore-source-version" className="font-mono text-lg text-orange-600">
                {version.label}
              </span>
              ?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Restoring creates a new immutable version. Existing history will not be overwritten or deleted.
            </p>

            <div className="mt-4 flex gap-2.5 rounded-xl bg-orange-50/70 border border-orange-200/80 px-4 py-3">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-orange-600" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-orange-950 font-medium">
                The restored content becomes the newest version on <span className="font-mono">{branchName || version.branch}</span>, with{' '}
                <span className="font-mono">{version.label}</span> recorded as its source parent.
              </p>
          </div>

            {error ? (
              <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-medium text-rose-800" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-6 flex justify-end gap-3 pt-3 border-t border-line">
              <button
                type="button"
                data-testid="restore-cancel"
                onClick={onCancel}
                disabled={restoring}
                className="rounded-lg border border-line bg-surface px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-canvas">
                Cancel
              </button>
              <button
                type="button"
                data-testid="restore-confirm"
                onClick={onConfirm}
                disabled={restoring}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-all hover:from-orange-500 hover:to-amber-500 disabled:cursor-wait disabled:opacity-60">
                <RotateCcwIcon className="h-4 w-4" />
                {restoring ? 'Restoring…' : 'Create new version'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
