import React from 'react';
import { NavLink } from 'react-router-dom';
import { ActivityIcon, FileTextIcon, GitBranchIcon, LayoutGridIcon, SettingsIcon } from 'lucide-react';
import { documents } from '../data/documents';

const primaryLinks = [
  { to: '/dashboard', label: 'Overview', icon: LayoutGridIcon },
  { to: '/documents', label: 'Documents', icon: FileTextIcon },
  { to: '/branches', label: 'Branches', icon: GitBranchIcon },
  { to: '/activity', label: 'Activity', icon: ActivityIcon },
];

function linkClass(isActive: boolean): string {
  return [
    'flex items-center gap-2.5 rounded-xl px-3.5 py-2 text-sm font-medium transition-all duration-150 ease-serene',
    isActive
      ? 'bg-orange-50/90 text-orange-900 border border-orange-200/90 shadow-xs'
      : 'text-ink-soft hover:bg-canvas hover:text-ink border border-transparent',
  ].join(' ');
}

export function SideNav() {
  return (
    <nav aria-label="Primary" className="flex h-full flex-col gap-7 px-4 py-6">
      <ul className="space-y-1">
        {primaryLinks.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink to={to} className={({ isActive }: { isActive: boolean }) => linkClass(isActive)}>
              {({ isActive }) => (
                <>
                  <Icon
                    className={`h-4 w-4 transition-colors ${
                      isActive ? 'text-orange-600' : 'text-ink-muted'
                    }`}
                    aria-hidden="true"
                  />
                  {label}
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      <div>
        <p className="label-eyebrow px-3.5">Your documents</p>
        <ul className="mt-2 space-y-1">
          {documents.map((doc) => (
            <li key={doc.id}>
              <NavLink
                to={`/documents/${doc.id}`}
                className={({ isActive }: { isActive: boolean }) => linkClass(isActive)}
                title={doc.title}
              >
                {({ isActive }) => (
                  <>
                    <span className="truncate">{doc.reference}</span>
                    {doc.reviewNeeded ? (
                      <span
                        className="ml-auto h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.6)]"
                        aria-label="Review needed"
                      />
                    ) : null}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto pt-4 border-t border-line/60">
        <NavLink to="/settings" className={({ isActive }: { isActive: boolean }) => linkClass(isActive)}>
          {({ isActive }) => (
            <>
              <SettingsIcon
                className={`h-4 w-4 ${isActive ? 'text-orange-600' : 'text-ink-muted'}`}
                aria-hidden="true"
              />
              Settings
            </>
          )}
        </NavLink>
      </div>
    </nav>
  );
}