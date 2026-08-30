import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { UserPlusIcon, XIcon, ShieldCheckIcon } from 'lucide-react';
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
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('Editor');

  function setRole(id: string, role: Role) {
    setPeople((current) => current.map((person) => (person.id === id ? { ...person, role } : person)));
  }

  function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail.trim() || !newEmail.includes('@')) return;
    const namePart = newEmail.split('@')[0].replace('.', ' ');
    const capitalName = namePart.charAt(0).toUpperCase() + namePart.slice(1);

    const newPerson = {
      id: `collab_${Date.now()}`,
      name: capitalName,
      email: newEmail.trim(),
      role: newRole,
    };

    setPeople((prev) => [...prev, newPerson]);
    setNewEmail('');
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
            aria-labelledby="share-title"
            className="relative w-full max-w-lg rounded-2xl border border-line bg-surface p-6 shadow-lift"
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 6 }}
            transition={{ duration: 0.22, ease: [0.23, 1, 0.32, 1] }}>
            
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <h2 id="share-title" className="font-serif text-xl font-semibold text-ink">
                  Document Permissions
                </h2>
                <p className="mt-0.5 text-xs text-ink-muted">{documentTitle}</p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-canvas hover:text-ink">
                <XIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleAddPerson} className="mt-4 flex gap-2">
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="flex-1 rounded-xl border border-line bg-canvas/60 px-3.5 py-2 text-sm font-medium text-ink placeholder:text-ink-muted focus:border-orange-500 focus:outline-none"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as Role)}
                className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-ink">
                {roles.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-700">
                <UserPlusIcon className="h-3.5 w-3.5" />
                Add
              </button>
            </form>

            <ul className="mt-5 divide-y divide-line max-h-56 overflow-y-auto pr-1">
              {people.map((person) => (
                <li key={person.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{person.name}</span>
                    <span className="block truncate text-xs text-ink-muted">{person.email}</span>
                  </span>
                  <select
                    id={`role-${person.id}`}
                    value={person.role}
                    onChange={(event) => setRole(person.id, event.target.value as Role)}
                    className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink">
                    {roles.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-canvas p-3 text-xs text-ink-muted">
              <ShieldCheckIcon className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Multi-tenant isolation and RBAC role boundaries are enforced for every version request.</span>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2 text-sm font-medium text-white shadow-xs transition-all hover:from-orange-500 hover:to-amber-500">
                Done
              </button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}