import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { collaborators as initialCollaborators } from '../data/documents';
import type { Role } from '../types';

interface ShareDialogProps {
  open: boolean;
  documentTitle: string;
  onClose: () => void;
}

const roles: Role[] = ['Owner', 'Editor', 'Viewer'];

export function ShareDialog({ open, documentTitle, onClose }: ShareDialogProps) {
  const [people, setPeople] = useState(initialCollaborators);

  function setRole(id: string, role: Role) {
    setPeople((current) => current.map((person) => person.id === id ? { ...person, role } : person));
  }

  return (
    <AnimatePresence>
      {open ?
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}>
        
          <div className="absolute inset-0 bg-ink/25" onClick={onClose} aria-hidden="true" />
          <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="share-title"
          className="relative w-full max-w-md rounded-2xl border border-line bg-surface p-6 shadow-lift"
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 6 }}
          transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
          
            <h2 id="share-title" className="font-serif text-xl text-ink">
              Share access
            </h2>
            <p className="mt-1 text-xs text-ink-muted">{documentTitle}</p>

            <ul className="mt-5 divide-y divide-line">
              {people.map((person) =>
            <li key={person.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">{person.name}</span>
                    <span className="block truncate text-xs text-ink-muted">{person.email}</span>
                  </span>
                  <label className="sr-only" htmlFor={`role-${person.id}`}>
                    Role for {person.name}
                  </label>
                  <select
                id={`role-${person.id}`}
                value={person.role}
                onChange={(event) => setRole(person.id, event.target.value as Role)}
                className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-sm text-ink">
                
                    {roles.map((role) =>
                <option key={role} value={role}>
                        {role}
                      </option>
                )}
                  </select>
                </li>
            )}
            </ul>

            <p className="mt-4 text-xs leading-relaxed text-ink-muted">
              Roles shown here are informational. Access is enforced on the server for every request.
            </p>

            <div className="mt-6 flex justify-end">
              <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-sage-600 px-4 py-2 text-sm font-medium text-white transition-colors duration-150 ease-serene hover:bg-sage-700">
              
                Done
              </button>
            </div>
          </motion.div>
        </motion.div> :
      null}
    </AnimatePresence>);

}