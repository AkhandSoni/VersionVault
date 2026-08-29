import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ActivityIcon, FileTextIcon, GitBranchIcon, SearchIcon, SettingsIcon } from 'lucide-react';
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
      hint: `${doc.reference} · ${doc.versionCount} versions`,
      to: `/documents/${doc.id}`,
      icon: <FileTextIcon className="h-4 w-4" aria-hidden="true" />
    }));
    return [
    ...docCommands,
    {
      id: 'branches',
      label: 'Branches',
      hint: 'Compare parallel drafts',
      to: '/branches',
      icon: <GitBranchIcon className="h-4 w-4" aria-hidden="true" />
    },
    {
      id: 'activity',
      label: 'Activity',
      hint: 'Audit trail',
      to: '/activity',
      icon: <ActivityIcon className="h-4 w-4" aria-hidden="true" />
    },
    {
      id: 'settings',
      label: 'Settings',
      hint: 'Access and preferences',
      to: '/settings',
      icon: <SettingsIcon className="h-4 w-4" aria-hidden="true" />
    }];

  }, []);

  const results = commands.filter((command) =>
  `${command.label} ${command.hint}`.toLowerCase().includes(query.trim().toLowerCase())
  );

  return (
    <AnimatePresence>
      {open ?
      <motion.div
        className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}>
        
          <div
          className="absolute inset-0 bg-ink/20"
          onClick={onClose}
          aria-hidden="true" />
        
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Search documents and pages"
          className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-line bg-surface shadow-lift"
          initial={{ opacity: 0, scale: 0.96, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: -6 }}
          transition={{ duration: 0.18, ease: [0.23, 1, 0.32, 1] }}>
          
            <div className="flex items-center gap-3 border-b border-line px-4 py-3">
              <SearchIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
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
              placeholder="Search documents, branches, pages"
              aria-label="Search"
              className="w-full bg-transparent text-sm text-ink placeholder:text-ink-muted focus:outline-none" />
            
            </div>
            <ul className="max-h-72 overflow-y-auto p-2">
              {results.length === 0 ?
            <li className="px-3 py-6 text-center text-sm text-ink-muted">
                  Nothing matches “{query}”.
                </li> :

            results.map((command) =>
            <li key={command.id}>
                    <button
                type="button"
                onClick={() => {
                  navigate(command.to);
                  onClose();
                }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-150 ease-serene hover:bg-sage-50">
                
                      <span className="text-sage-600">{command.icon}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-ink">{command.label}</span>
                        <span className="block truncate text-xs text-ink-muted">{command.hint}</span>
                      </span>
                    </button>
                  </li>
            )
            }
            </ul>
          </motion.div>
        </motion.div> :
      null}
    </AnimatePresence>);

}