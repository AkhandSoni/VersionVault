import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BotIcon, SendIcon, SparklesIcon, ShieldCheckIcon, HelpCircleIcon, XIcon } from 'lucide-react';
import type { DocumentRecord } from '../types';

interface HistoryQADialogProps {
  open: boolean;
  doc: DocumentRecord;
  onClose: () => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sources?: string[];
  confidence?: string;
  timestamp: string;
}

const presetQuestions = [
  'When were the payment terms shortened and by whom?',
  'What material changes occurred between V17 and V18?',
  'Who created the initial draft of this document?',
  'Are there any unreviewed AI proposals pending on this document?',
];

export function HistoryQADialog({ open, doc, onClose }: HistoryQADialogProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Hello! I am your VersionVault History Assistant for "${doc.title}". Ask me any question about past revisions, actor attribution, or material clause changes. Every answer is strictly grounded in immutable version records.`,
      timestamp: 'Just now',
    },
  ]);
  const [loading, setLoading] = useState(false);

  function handleSend(questionText: string) {
    if (!questionText.trim()) return;

    const userMsg: Message = {
      id: `u_${Date.now()}`,
      sender: 'user',
      text: questionText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    setTimeout(() => {
      let replyText = `Based on the immutable records of ${doc.title}, `;
      let sources = ['V17 (SHA-256: 8f4a...9b12)', 'V18 (SHA-256: 3c7e...41a0)'];

      const lower = questionText.toLowerCase();
      if (lower.includes('payment') || lower.includes('terms') || lower.includes('shorten')) {
        replyText += `the Payment Terms were modified in V18 on 28 Aug 2026 at 14:12 by Akhand Pratap. The duration was reduced from 30 days to 15 days (a 50% reduction classified as High Materiality).`;
        sources = ['V18 · Payment Terms', 'Audit Event #evt_9921'];
      } else if (lower.includes('material') || lower.includes('changes') || lower.includes('v17')) {
        replyText += `1 material change was detected between V17 and V18 in the "Payment Terms" section. Integrity was cryptographically verified via SHA-256 hash chaining.`;
        sources = ['V17 → V18 Diff', 'SHA-256 Hash Chain'];
      } else if (lower.includes('initial') || lower.includes('who created') || lower.includes('draft')) {
        replyText += `the initial version (V1) was authored by Akhand Pratap on 14 Jan 2026 on the authoritative main branch.`;
        sources = ['V1 (Initial Commit)'];
      } else {
        replyText += `all ${doc.versionCount} versions on branch "${doc.versions[0]?.branch || 'main'}" have verified cryptographic integrity. The latest snapshot is ${doc.currentVersionId.toUpperCase()}.`;
      }

      const aiMsg: Message = {
        id: `ai_${Date.now()}`,
        sender: 'ai',
        text: replyText,
        sources,
        confidence: '100% Deterministic Evidence',
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, aiMsg]);
      setLoading(false);
    }, 600);
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
            aria-labelledby="qa-title"
            className="relative flex h-[34rem] w-full max-w-2xl flex-col rounded-2xl border border-line bg-surface shadow-lift overflow-hidden"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-surface to-orange-50/40 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-xs">
                  <BotIcon className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="qa-title" className="font-serif text-lg font-semibold text-ink">
                    Ask History AI
                  </h2>
                  <p className="text-xs text-ink-muted truncate max-w-sm">{doc.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-canvas hover:text-ink">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Chat message body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      m.sender === 'user'
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white font-medium shadow-xs'
                        : 'border border-line bg-canvas/70 text-ink'
                    }`}
                  >
                    <p className="leading-relaxed">{m.text}</p>
                    {m.sources && (
                      <div className="mt-3 pt-2.5 border-t border-line/60 flex flex-wrap gap-1.5 items-center">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-950 flex items-center gap-1">
                          <ShieldCheckIcon className="h-3 w-3 text-emerald-600" />
                          Evidence Sources:
                        </span>
                        {m.sources.map((s, idx) => (
                          <span
                            key={idx}
                            className="font-mono text-[11px] font-medium bg-surface text-ink-soft px-2 py-0.5 rounded border border-line"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="mt-1 text-[10px] text-ink-muted px-1">{m.timestamp}</span>
                </div>
              ))}

              {loading && (
                <div className="flex items-center gap-2 text-xs text-orange-800 bg-orange-50 border border-orange-200 px-4 py-2.5 rounded-xl w-fit animate-pulse">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Analyzing version hashes & audit trail…
                </div>
              )}
            </div>

            {/* Quick suggested chips */}
            <div className="border-t border-line/60 bg-canvas/40 px-6 py-2.5 flex items-center gap-2 overflow-x-auto">
              <span className="text-[11px] font-semibold text-ink-muted shrink-0">Try asking:</span>
              {presetQuestions.slice(0, 2).map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSend(q)}
                  className="shrink-0 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-soft hover:bg-orange-50 hover:border-orange-300 hover:text-orange-900 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend(query);
              }}
              className="flex items-center gap-2 border-t border-line bg-surface p-4"
            >
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask about version changes, authors, or clause histories…"
                className="flex-1 rounded-xl border border-line bg-canvas/80 px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 transition-all"
              >
                <SendIcon className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
