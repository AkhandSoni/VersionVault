import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheckIcon, UserIcon, BotIcon, XIcon, GitCommitIcon } from 'lucide-react';
import type { DocumentRecord, Version } from '../types';

interface ProvenanceBlameDialogProps {
  open: boolean;
  doc: DocumentRecord;
  version: Version;
  onClose: () => void;
}

interface MockLineBlame {
  lineNum: number;
  text: string;
  author: string;
  isAi: boolean;
  versionLabel: string;
  timestamp: string;
  hash: string;
}

export function ProvenanceBlameDialog({ open, doc, version, onClose }: ProvenanceBlameDialogProps) {
  // Sample line-by-line provenance data based on current version
  const sampleLines: MockLineBlame[] = [
    {
      lineNum: 1,
      text: '# MASTER VENDOR SERVICES AGREEMENT',
      author: 'Akhand Pratap',
      isAi: false,
      versionLabel: 'V1',
      timestamp: '14 Jan 2026',
      hash: 'e3b0c442',
    },
    {
      lineNum: 2,
      text: '',
      author: 'Akhand Pratap',
      isAi: false,
      versionLabel: 'V1',
      timestamp: '14 Jan 2026',
      hash: 'e3b0c442',
    },
    {
      lineNum: 3,
      text: '## SECTION 4. PAYMENT TERMS & SCHEDULE',
      author: 'Akhand Pratap',
      isAi: false,
      versionLabel: 'V1',
      timestamp: '14 Jan 2026',
      hash: 'e3b0c442',
    },
    {
      lineNum: 4,
      text: 'Client shall remit full payment within 15 calendar days of receiving invoice.',
      author: 'Akhand Pratap (Modified from 30 days)',
      isAi: false,
      versionLabel: 'V18',
      timestamp: '28 Aug 2026',
      hash: '3c7e9902',
    },
    {
      lineNum: 5,
      text: 'Late payments shall accrue interest at 1.5% per month or maximum legal rate.',
      author: 'ai_agent_meta_llama_3_1_70b (AI Generated Clause)',
      isAi: true,
      versionLabel: 'V14',
      timestamp: '12 Aug 2026',
      hash: '9a8b11c0',
    },
    {
      lineNum: 6,
      text: '',
      author: 'Akhand Pratap',
      isAi: false,
      versionLabel: 'V1',
      timestamp: '14 Jan 2026',
      hash: 'e3b0c442',
    },
    {
      lineNum: 7,
      text: '## SECTION 8. INDEMNIFICATION & LIABILITY CAP',
      author: 'Akhand Pratap',
      isAi: false,
      versionLabel: 'V1',
      timestamp: '14 Jan 2026',
      hash: 'e3b0c442',
    },
    {
      lineNum: 8,
      text: 'Total aggregate liability shall not exceed total fees paid under this Agreement in prior 12 months.',
      author: 'ai_agent_claude_3_5_sonnet (AI Clause Proposal)',
      isAi: true,
      versionLabel: 'V16',
      timestamp: '22 Aug 2026',
      hash: '7f2e41d8',
    },
  ];

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
            aria-labelledby="blame-title"
            className="relative flex h-[36rem] w-full max-w-4xl flex-col rounded-2xl border border-line bg-surface shadow-lift overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
            
            {/* Header */}
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
                    {doc.title} · <span className="font-mono font-medium text-orange-950">{version.label}</span>
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

            {/* Blame Table */}
            <div className="flex-1 overflow-y-auto font-mono text-xs">
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
                  {sampleLines.map((line) => (
                    <tr key={line.lineNum} className="hover:bg-orange-50/40 transition-colors">
                      <td className="py-2.5 px-3 text-right text-ink-muted select-none">
                        {line.lineNum}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="inline-flex items-center gap-1 font-semibold text-ink bg-canvas px-1.5 py-0.5 rounded border border-line">
                          <GitCommitIcon className="h-3 w-3 text-orange-600" />
                          {line.versionLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="flex items-center gap-1.5">
                          {line.isAi ? (
                            <BotIcon className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                          ) : (
                            <UserIcon className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                          )}
                          <span
                            className={`truncate text-xs ${
                              line.isAi ? 'font-semibold text-orange-950' : 'text-ink-soft font-medium'
                            }`}
                          >
                            {line.author}
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-ink font-sans text-xs">
                        {line.text ? (
                          line.text
                        ) : (
                          <span className="text-ink-muted italic">&lt;empty line&gt;</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer Summary */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-canvas/70 px-6 py-3 text-xs">
              <div className="flex items-center gap-4 text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <UserIcon className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Human Authored: <strong>75%</strong></span>
                </span>
                <span className="flex items-center gap-1.5">
                  <BotIcon className="h-3.5 w-3.5 text-orange-600" />
                  <span>AI Generated: <strong>25%</strong></span>
                </span>
              </div>
              <span className="font-mono text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                Cryptographically Attributed
              </span>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
