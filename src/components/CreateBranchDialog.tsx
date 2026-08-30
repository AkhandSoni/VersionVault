import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GitBranchIcon, PlusIcon, XIcon, InfoIcon } from 'lucide-react';
import type { DocumentRecord } from '../types';

interface CreateBranchDialogProps {
  open: boolean;
  doc: DocumentRecord;
  onClose: () => void;
  onCreate: (branchName: string, baseVersionId: string) => Promise<void> | void;
}

export function CreateBranchDialog({ open, doc, onClose, onCreate }: CreateBranchDialogProps) {
  const [branchName, setBranchName] = useState('');
  const [baseVersion, setBaseVersion] = useState(doc.currentVersionId);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!branchName.trim()) return;

    setLoading(true);
    try {
      await onCreate(branchName.trim().toLowerCase().replace(/[^a-z0-9_-]+/g, '-'), baseVersion);
      onClose();
      setBranchName('');
    } finally {
      setLoading(false);
    }
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
            aria-labelledby="create-branch-title"
            className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lift"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
            
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 border border-amber-200">
                  <GitBranchIcon className="h-4 w-4" />
                </span>
                <h2 id="create-branch-title" className="font-serif text-xl font-semibold text-ink">
                  Create New Branch
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
                <label htmlFor="branch-name" className="label-eyebrow text-ink-muted">
                  Branch Name
                </label>
                <input
                  id="branch-name"
                  type="text"
                  required
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="e.g. draft-q4-terms or legal-review"
                  className="mt-1.5 w-full rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5 font-mono text-sm font-medium text-ink focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label htmlFor="base-version" className="label-eyebrow text-ink-muted">
                  Base Version
                </label>
                <select
                  id="base-version"
                  value={baseVersion}
                  onChange={(e) => setBaseVersion(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5 font-mono text-sm font-medium text-ink focus:border-orange-500 focus:outline-none">
                  {doc.versions.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label} ({v.branch}) — {v.summary}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl bg-canvas p-3.5 text-xs text-ink-muted">
                <InfoIcon className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Branches allow parallel exploration without mutating the authoritative history on main.
                </p>
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
                  disabled={!branchName.trim() || loading}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2 text-sm font-medium text-white shadow-xs hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 transition-all">
                  <PlusIcon className="h-4 w-4" />
                  {loading ? 'Creating…' : 'Create Branch'}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
