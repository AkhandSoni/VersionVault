import React, { useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BotIcon, SendIcon, SparklesIcon, ShieldCheckIcon, XIcon } from 'lucide-react';
import { askHistoryQuestion } from '../lib/api-client';
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
  'What is this document about?',
  'What changed in the latest version?',
  'Which versions contain material changes?',
  'Who created the first version of this document?',
];

export function HistoryQADialog({ open, doc, onClose }: HistoryQADialogProps) {
  const [query, setQuery] = useState('');
  const messageCounter = useRef(0);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Ask about "${doc.title}". Answers are grounded in the document's extracted content and authorized version evidence.`,
      timestamp: 'Just now',
    },
  ]);
  const [loading, setLoading] = useState(false);

  function nextMessageId(prefix: string) {
    messageCounter.current += 1;
    return `${prefix}_${messageCounter.current}`;
  }

  async function handleSend(questionText: string) {
    if (!questionText.trim() || loading) return;

    const userMsg: Message = {
      id: nextMessageId('u'),
      sender: 'user',
      text: questionText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setQuery('');
    setLoading(true);

    try {
      const result = await askHistoryQuestion(doc.id, questionText);
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId('ai'),
          sender: 'ai',
          text: result.answer,
          sources: result.sources,
          confidence: 'Grounded in authorized evidence',
          timestamp: 'Just now',
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: nextMessageId('ai'),
          sender: 'ai',
          text: err instanceof Error ? err.message : 'History Q&A is unavailable right now.',
          timestamp: 'Just now',
        },
      ]);
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
            aria-labelledby="qa-title"
            className="relative flex h-[34rem] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
            <div className="flex items-center justify-between border-b border-line bg-gradient-to-r from-surface to-orange-50/40 px-6 py-4">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-xs">
                  <BotIcon className="h-4 w-4" />
                </span>
                <div>
                  <h2 id="qa-title" className="font-serif text-lg font-semibold text-ink">
                    Ask History AI
                  </h2>
                  <p className="max-w-sm truncate text-xs text-ink-muted">{doc.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-canvas hover:text-ink">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto p-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-r from-orange-600 to-amber-600 font-medium text-white shadow-xs'
                        : 'border border-line bg-canvas/70 text-ink'
                    }`}>
                    <p className="leading-relaxed">{message.text}</p>
                    {message.sources && message.sources.length > 0 ? (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-2.5">
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-orange-950">
                          <ShieldCheckIcon className="h-3 w-3 text-emerald-600" />
                          Evidence Sources:
                        </span>
                        {message.sources.map((source) => (
                          <span
                            key={source}
                            className="rounded border border-line bg-surface px-2 py-0.5 font-mono text-[11px] font-medium text-ink-soft">
                            {source}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <span className="mt-1 px-1 text-[10px] text-ink-muted">{message.timestamp}</span>
                </div>
              ))}

              {loading ? (
                <div className="flex w-fit animate-pulse items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-xs text-orange-800">
                  <SparklesIcon className="h-3.5 w-3.5" />
                  Analyzing the document content and authorized version evidence...
                </div>
              ) : null}
            </div>

            <div className="flex items-center gap-2 overflow-x-auto border-t border-line/60 bg-canvas/40 px-6 py-2.5">
              <span className="shrink-0 text-[11px] font-semibold text-ink-muted">Try asking:</span>
              {presetQuestions.slice(0, 2).map((question) => (
                <button
                  key={question}
                  type="button"
                  onClick={() => void handleSend(question)}
                  className="shrink-0 rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-soft transition-colors hover:bg-orange-50 hover:border-orange-300 hover:text-orange-900">
                  {question}
                </button>
              ))}
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void handleSend(query);
              }}
              className="flex items-center gap-2 border-t border-line bg-surface p-4">
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Ask about version changes, authors, or clause histories..."
                className="flex-1 rounded-xl border border-line bg-canvas/80 px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-xs transition-all hover:from-orange-500 hover:to-amber-500 disabled:opacity-50">
                <SendIcon className="h-4 w-4" />
              </button>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
