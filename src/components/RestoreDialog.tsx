import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { InfoIcon } from 'lucide-react';
import type { Version } from '../types';

interface RestoreDialogProps {
  open: boolean;
  version?: Version;
  onCancel: () => void;
  onConfirm: () => void;
}

export function RestoreDialog({ open, version, onCancel, onConfirm }: RestoreDialogProps) {
  return (
    <AnimatePresence>
      {open && version ?
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}>
        
          <div className="absolute inset-0 bg-ink/25" onClick={onCancel} aria-hidden="true" />
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
          
            <h2 id="restore-title" className="font-serif text-xl text-ink">
              Restore{' '}
              <span data-testid="restore-source-version" className="font-mono text-lg">
                {version.label}
              </span>
              ?
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Restoring creates a new version. Existing history will not be deleted.
            </p>

            <div className="mt-4 flex gap-2.5 rounded-xl bg-canvas px-4 py-3">
              <InfoIcon className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" aria-hidden="true" />
              <p className="text-xs leading-relaxed text-ink-muted">
                The restored content becomes the newest version on {version.branch}, with{' '}
                {version.label} recorded as its source.
              </p>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
              type="button"
              data-testid="restore-cancel"
              onClick={onCancel}
              className="rounded-lg border border-line bg-surface px-4 py-2 text-sm text-ink transition-colors duration-150 ease-serene hover:bg-canvas">
              
                Cancel
              </button>
              <button
              type="button"
              data-testid="restore-confirm"
              onClick={onConfirm}
              className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 ease-serene hover:bg-sage-700">
              
                Create new version
              </button>
            </div>
          </motion.div>
        </motion.div> :
      null}
    </AnimatePresence>);

}