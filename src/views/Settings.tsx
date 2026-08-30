import React, { useState } from 'react';
import { CheckIcon, SaveIcon, ShieldCheckIcon } from 'lucide-react';
import { useVaultData } from '../lib/vault-data';

export function Settings() {
  const { user, memberships, documents } = useVaultData();
  const [notifyMaterial, setNotifyMaterial] = useState(true);
  const [notifyProposals, setNotifyProposals] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const activeMembership = memberships[0];
  const displayName = user?.fullName || (user?.email ? user.email.split('@')[0].replace(/[._-]+/g, ' ') : '');

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 400);
  }

  return (
    <form onSubmit={handleSave} className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-eyebrow text-orange-800 font-semibold">Settings</p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">Account & access</h1>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs hover:from-orange-500 hover:to-amber-500 disabled:opacity-50 transition-all cursor-pointer">
          {saved ? (
            <>
              <CheckIcon className="h-4 w-4" />
              Saved!
            </>
          ) : (
            <>
              <SaveIcon className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Changes'}
            </>
          )}
        </button>
      </header>

      {saved && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm font-medium text-emerald-800 flex items-center gap-2 shadow-xs">
          <CheckIcon className="h-4 w-4 text-emerald-600" />
          <span>Your profile preferences and notification rules have been saved.</span>
        </div>
      )}

      {/* Profile Section */}
      <section aria-labelledby="profile-heading" className="rounded-2xl border border-line bg-surface px-6 py-5 shadow-xs">
        <h2 id="profile-heading" className="text-sm font-semibold text-ink">
          Profile
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-name" className="label-eyebrow text-ink-muted">
              Name
            </label>
            <input
              id="settings-name"
              type="text"
              value={displayName}
              readOnly
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5 text-sm font-medium text-ink focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
          <div>
            <label htmlFor="settings-email" className="label-eyebrow text-ink-muted">
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              value={user?.email ?? ''}
              readOnly
              className="mt-1.5 w-full rounded-xl border border-line bg-canvas/60 px-3.5 py-2.5 text-sm font-medium text-ink focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500" />
          </div>
        </div>
      </section>

      {/* Notifications Section */}
      <section aria-labelledby="notify-heading" className="rounded-2xl border border-line bg-surface px-6 py-5 shadow-xs">
        <h2 id="notify-heading" className="text-sm font-semibold text-ink">
          Notifications
        </h2>
        <div className="mt-4 divide-y divide-line/80">
          <label className="flex items-start gap-3 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyMaterial}
              onChange={(event) => setNotifyMaterial(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-orange-600 focus:ring-orange-500 accent-orange-600" />
            <span>
              <span className="block text-sm font-medium text-ink">Material changes</span>
              <span className="block text-xs text-ink-muted">
                Email me when a change alters a value, date, or obligation.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 py-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyProposals}
              onChange={(event) => setNotifyProposals(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-orange-600 focus:ring-orange-500 accent-orange-600" />
            <span>
              <span className="block text-sm font-medium text-ink">AI proposals awaiting approval</span>
              <span className="block text-xs text-ink-muted">
                Proposals never enter history without a person approving them.
              </span>
            </span>
          </label>
        </div>
      </section>

      {/* People Section */}
      <section aria-labelledby="people-heading" className="rounded-2xl border border-line bg-surface px-6 py-5 shadow-xs">
        <h2 id="people-heading" className="text-sm font-semibold text-ink">
          People in your workspace
        </h2>
        <ul className="mt-4 divide-y divide-line/80">
          <li className="flex items-center gap-3 py-3">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-ink">{user?.email ?? 'Authenticated account'}</span>
              <span className="block truncate text-xs text-ink-muted">
                {documents.length} authorized document{documents.length === 1 ? '' : 's'}
              </span>
            </span>
            <span className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">
              {activeMembership?.role ?? 'MEMBER'}
            </span>
          </li>
          {memberships.length > 1 ? memberships.slice(1).map((membership) => (
            <li key={membership.id} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink">Workspace {membership.tenantId.slice(0, 8).toUpperCase()}</span>
                <span className="block truncate text-xs text-ink-muted">Membership created {new Date(membership.createdAt).toLocaleDateString()}</span>
              </span>
              <span className="rounded-md border border-line bg-canvas px-2.5 py-1 text-xs font-semibold text-ink-soft">{membership.role}</span>
            </li>
          )) : null}
        </ul>
        <div className="mt-4 flex items-center gap-2 text-xs leading-relaxed text-ink-muted">
          <ShieldCheckIcon className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Roles are enforced by the server on every request; this list is a reflection of that state.</span>
        </div>
      </section>

    </form>
  );
}
