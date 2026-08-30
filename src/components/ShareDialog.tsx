import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheckIcon, UserPlusIcon, XIcon } from 'lucide-react';
import * as api from '../lib/api-client';
import type { ApiCollaborator } from '../lib/api-client';

interface ShareDialogProps {
  open: boolean;
  documentId: string;
  documentTitle: string;
  onClose: () => void;
}

const roles: Array<'CONTRIBUTOR' | 'VIEWER'> = ['CONTRIBUTOR', 'VIEWER'];

function roleLabel(role: ApiCollaborator['role']) {
  if (role === 'CONTRIBUTOR') return 'Editor';
  if (role === 'VIEWER') return 'Viewer';
  return 'Owner';
}

export function ShareDialog({ open, documentId, documentTitle, onClose }: ShareDialogProps) {
  const [people, setPeople] = useState<ApiCollaborator[]>([]);
  const [targetUserId, setTargetUserId] = useState('');
  const [newRole, setNewRole] = useState<'CONTRIBUTOR' | 'VIEWER'>('CONTRIBUTOR');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(() => {
      setLoading(true);
      setError(null);
      void api.listCollaborators(documentId)
        .then(setPeople)
        .catch((err) => setError(err instanceof Error ? err.message : 'Could not load collaborators.'))
        .finally(() => setLoading(false));
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [documentId, open]);

  async function upsertCollaborator(userId: string, role: 'CONTRIBUTOR' | 'VIEWER') {
    setSaving(true);
    setError(null);
    try {
      const collaborator = await api.addCollaborator(documentId, userId, role);
      setPeople((current) => {
        const next = current.filter((person) => person.userId !== collaborator.userId);
        return [...next, collaborator].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      });
      setTargetUserId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update document permissions.');
    } finally {
      setSaving(false);
    }
  }

  function handleAddPerson(e: React.FormEvent) {
    e.preventDefault();
    const userId = targetUserId.trim();
    if (!userId) return;
    void upsertCollaborator(userId, newRole);
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

            <form onSubmit={handleAddPerson} className="mt-4 flex gap-2">
              <input
                type="text"
                required
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                placeholder="Supabase user ID"
                className="min-w-0 flex-1 rounded-xl border border-line bg-canvas/60 px-3.5 py-2 text-sm font-medium text-ink placeholder:text-ink-muted focus:border-orange-500 focus:outline-none"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as 'CONTRIBUTOR' | 'VIEWER')}
                className="rounded-xl border border-line bg-canvas px-3 py-2 text-xs font-medium text-ink">
                {roles.map((role) => (
                  <option key={role} value={role}>{roleLabel(role)}</option>
                ))}
              </select>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1 rounded-xl bg-orange-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
                <UserPlusIcon className="h-3.5 w-3.5" />
                Add
              </button>
            </form>

            {error ? (
              <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            ) : null}

            <ul className="mt-5 max-h-56 divide-y divide-line overflow-y-auto pr-1">
              {loading ? (
                <li className="py-3 text-sm text-ink-muted">Loading collaborators...</li>
              ) : null}
              {!loading && people.length === 0 ? (
                <li className="py-3 text-sm text-ink-muted">No additional collaborators on this document yet.</li>
              ) : null}
              {people.map((person) => (
                <li key={person.id} className="flex items-center gap-3 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">{person.userId}</span>
                    <span className="block truncate text-xs text-ink-muted">Added {new Date(person.createdAt).toLocaleDateString()}</span>
                  </span>
                  {person.role === 'OWNER' ? (
                    <span className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink">
                      Owner
                    </span>
                  ) : (
                    <select
                      id={`role-${person.id}`}
                      value={person.role}
                      disabled={saving}
                      onChange={(event) => void upsertCollaborator(person.userId, event.target.value as 'CONTRIBUTOR' | 'VIEWER')}
                      className="rounded-lg border border-line bg-canvas px-2.5 py-1.5 text-xs font-medium text-ink">
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {roleLabel(role)}
                        </option>
                      ))}
                    </select>
                  )}
                </li>
              ))}
            </ul>

            <div className="mt-4 flex items-center gap-2 rounded-xl bg-canvas p-3 text-xs text-ink-muted">
              <ShieldCheckIcon className="h-4 w-4 shrink-0 text-emerald-600" />
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
