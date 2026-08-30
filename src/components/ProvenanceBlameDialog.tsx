import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BotIcon, GitCommitIcon, ShieldCheckIcon, UserIcon, XIcon } from 'lucide-react';
import * as api from '../lib/api-client';
import type { DocumentRecord, Version } from '../types';

interface ProvenanceBlameDialogProps {
  open: boolean;
  doc: DocumentRecord;
  version: Version;
  onClose: () => void;
}

export function ProvenanceBlameDialog({ open, doc, version, onClose }: ProvenanceBlameDialogProps) {
  const [lines, setLines] = useState<api.ApiLineBlame[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (!cancelled) {
          setLoading(true);
          setError(null);
        }
        return api.getDocumentBlame(doc.id);
      })
      .then((items) => {
        if (!cancelled) setLines(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setLines([]);
          setError(err instanceof Error ? err.message : 'Could not load provenance.');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [doc.id, open]);

  const humanCount = useMemo(
    () => lines.filter((line) => line.authorType === 'human' || line.authorType === 'user').length,
    [lines],
  );
  const humanPercent = lines.length ? Math.round((humanCount / lines.length) * 100) : 0;
  const aiPercent = lines.length ? 100 - humanPercent : 0;

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          data-testid="blame-panel"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}>
          <div className="absolute inset-0 bg-ink/25 backdrop-blur-xs" onClick={onClose} aria-hidden="true" />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="blame-title"
            className="relative flex h-[36rem] w-full max-w-4xl flex-col rounded-2xl border border-line bg-surface shadow-lift overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
            <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-surface to-orange-50/30 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                  <ShieldCheckIcon className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="blame-title" className="font-serif text-lg font-semibold text-ink">
                    Line Provenance & Blame
                  </h2>
                  <p className="text-xs text-ink-muted">
                    {doc.title} - <span className="font-mono font-medium text-orange-950">{version.label}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-canvas hover:text-ink">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto font-mono text-xs">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm font-medium text-ink-muted">
                  Loading provenance...
                </div>
              ) : error ? (
                <div className="m-6 rounded-lg border border-orange-200 bg-orange-50 px-4 py-3 text-sm font-medium text-orange-950">
                  {error}
                </div>
              ) : lines.length === 0 ? (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm font-medium text-ink-muted">
                  No extracted text is available for this document version yet.
                </div>
              ) : (
                <table className="w-full border-collapse text-left">
                  <thead className="sticky top-0 bg-canvas border-b border-line text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
                    <tr>
                      <th className="py-2.5 px-3 w-12 text-right">#</th>
                      <th className="py-2.5 px-3 w-28">Commit</th>
                      <th className="py-2.5 px-4 w-64">Attributed Author</th>
                      <th className="py-2.5 px-4">Line Content</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/60">
                    {lines.map((line) => {
                      const isAi = line.authorType === 'ai_agent';
                      return (
                        <tr key={`${line.versionId}-${line.lineNumber}`} className="hover:bg-orange-50/40 transition-colors">
                          <td className="py-2.5 px-3 text-right text-ink-muted select-none">
                            {line.lineNumber}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="inline-flex items-center gap-1 font-semibold text-ink bg-canvas px-1.5 py-0.5 rounded border border-line">
                              <GitCommitIcon className="h-3 w-3 text-orange-600" />
                              V{line.versionNumber}
                            </span>
                          </td>
                          <td className="py-2.5 px-4">
                            <span className="flex items-center gap-1.5">
                              {isAi ? (
                                <BotIcon className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                              ) : (
                                <UserIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                              )}
                              <span className={`truncate text-xs ${isAi ? 'font-semibold text-orange-950' : 'text-ink-soft font-medium'}`}>
                                {line.authorId}
                              </span>
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-ink font-sans text-xs">
                            {line.content ? line.content : <span className="text-ink-muted italic">&lt;empty line&gt;</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/70 px-6 py-3 text-xs">
              <div className="flex items-center gap-4 text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Human authored: <strong>{humanPercent}%</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <BotIcon className="h-3.5 w-3.5 text-orange-600" />
                  <span>AI generated: <strong>{aiPercent}%</strong></span>
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                Cryptographically attributed
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
