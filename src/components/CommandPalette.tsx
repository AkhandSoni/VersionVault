import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ActivityIcon, FileTextIcon, GitBranchIcon, SearchIcon, SettingsIcon, ArrowRightIcon } from 'lucide-react';
import { documents } from '../data/documents';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface Command {
  id: string;
  label: string;
  hint: string;
  to: string;
  icon: React.ReactNode;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (open) setQuery('');
  }, [open]);

  const commands = useMemo<Command[]>(() => {
    const docCommands: Command[] = documents.map((doc) => ({
      id: doc.id,
      label: doc.title,
      hint: `${doc.reference} · ${doc.versionCount} versions · ${doc.branches.join(', ')}`,
      to: `/documents/${doc.id}`,
      icon: <FileTextIcon className="h-4 w-4" aria-hidden="true" />,
    }));

    // Add search indexing for document changes
    const changeCommands: Command[] = [];
    documents.forEach((doc) => {
      doc.versions.forEach((ver) => {
        ver.changes.forEach((chg) => {
          changeCommands.push({
            id: `change_${chg.id}`,
            label: `${doc.title} · ${chg.section}`,
            hint: `${ver.label}: ${chg.previous} → ${chg.current} (${chg.category})`,
            to: `/documents/${doc.id}/compare/${ver.id}`,
            icon: <ArrowRightIcon className="h-4 w-4 text-orange-600" aria-hidden="true" />,
          });
        });
      });
    });

    return [
      ...docCommands,
      ...changeCommands,
      {
        id: 'branches',
        label: 'Branches',
        hint: 'Compare parallel drafts and feature branches',
        to: '/branches',
        icon: <GitBranchIcon className="h-4 w-4" aria-hidden="true" />,
      },
      {
        id: 'activity',
        label: 'Activity & Audit Log',
        hint: 'Inspect append-only regulatory audit trail',
        to: '/activity',
        icon: <ActivityIcon className="h-4 w-4" aria-hidden="true" />,
      },
      {
        id: 'settings',
        label: 'Settings & Permissions',
        hint: 'Access control and notification rules',
        to: '/settings',
        icon: <SettingsIcon className="h-4 w-4" aria-hidden="true" />,
      },
    ];
  }, []);

  const results = commands.filter((command) =>
    `${command.label} ${command.hint}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}>
          
          <div
            className="absolute inset-0 bg-ink/25 backdrop-blur-xs"
            onClick={onClose}
            aria-hidden="true"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search documents and pages"
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>
            
            <div className="flex items-center gap-3 border-b border-line px-4 py-3.5">
              <SearchIcon className="h-4 w-4 text-orange-600" aria-hidden="true" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') onClose();
                  if (event.key === 'Enter' && results[0]) {
                    navigate(results[0].to);
                    onClose();
                  }
                }}
                placeholder="Search documents, versions, clauses, or pages…"
                aria-label="Search"
                className="w-full bg-transparent text-sm font-medium text-ink placeholder:text-ink-muted focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-xs text-ink-muted hover:text-ink px-1">
                  Clear
                </button>
              )}
            </div>

            <ul className="max-h-80 overflow-y-auto p-2">
              {results.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-ink-muted">
                  Nothing matches “{query}”.
                </li>
              ) : (
                results.map((command) => (
                  <li key={command.id}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate(command.to);
                        onClose();
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors duration-150 ease-serene hover:bg-orange-50/80 group">
                      <span className="text-orange-600 group-hover:scale-105 transition-transform">{command.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-ink">{command.label}</span>
                        <span className="block truncate text-xs text-ink-muted">{command.hint}</span>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}