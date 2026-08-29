import React, { useState } from 'react';
import { collaborators } from '../data/documents';

export function Settings() {
  const [notifyMaterial, setNotifyMaterial] = useState(true);
  const [notifyProposals, setNotifyProposals] = useState(false);

  return (
    <div className="mx-auto max-w-3xl">
      <header>
        <p className="label-eyebrow">Settings</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">Account & access</h1>
      </header>

      <section aria-labelledby="profile-heading" className="mt-8 rounded-2xl border border-line bg-surface px-6 py-5">
        <h2 id="profile-heading" className="text-sm font-medium text-ink">
          Profile
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="settings-name" className="label-eyebrow">
              Name
            </label>
            <input
              id="settings-name"
              defaultValue="Akhand Pratap"
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink" />
            
          </div>
          <div>
            <label htmlFor="settings-email" className="label-eyebrow">
              Email
            </label>
            <input
              id="settings-email"
              type="email"
              defaultValue="akhand@versionvault.app"
              className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink" />
            
          </div>
        </div>
      </section>

      <section aria-labelledby="notify-heading" className="mt-6 rounded-2xl border border-line bg-surface px-6 py-5">
        <h2 id="notify-heading" className="text-sm font-medium text-ink">
          Notifications
        </h2>
        <div className="mt-4 divide-y divide-line">
          <label className="flex items-start gap-3 py-3">
            <input
              type="checkbox"
              checked={notifyMaterial}
              onChange={(event) => setNotifyMaterial(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-sage-600" />
            
            <span>
              <span className="block text-sm text-ink">Material changes</span>
              <span className="block text-xs text-ink-muted">
                Email me when a change alters a value, date, or obligation.
              </span>
            </span>
          </label>
          <label className="flex items-start gap-3 py-3">
            <input
              type="checkbox"
              checked={notifyProposals}
              onChange={(event) => setNotifyProposals(event.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-line text-sage-600" />
            
            <span>
              <span className="block text-sm text-ink">AI proposals awaiting approval</span>
              <span className="block text-xs text-ink-muted">
                Proposals never enter history without a person approving them.
              </span>
            </span>
          </label>
        </div>
      </section>

      <section aria-labelledby="people-heading" className="mt-6 rounded-2xl border border-line bg-surface px-6 py-5">
        <h2 id="people-heading" className="text-sm font-medium text-ink">
          People in your workspace
        </h2>
        <ul className="mt-4 divide-y divide-line">
          {collaborators.map((person) =>
          <li key={person.id} className="flex items-center gap-3 py-3">
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-ink">{person.name}</span>
                <span className="block truncate text-xs text-ink-muted">{person.email}</span>
              </span>
              <span className="text-xs text-ink-muted">{person.role}</span>
            </li>
          )}
        </ul>
        <p className="mt-4 text-xs leading-relaxed text-ink-muted">
          Roles are enforced by the server on every request; this list is a reflection of that state.
        </p>
      </section>
    </div>);

}