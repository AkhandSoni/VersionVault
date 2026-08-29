import React from 'react';
import { NavLink } from 'react-router-dom';
import { ActivityIcon, FileTextIcon, GitBranchIcon, LayoutGridIcon, SettingsIcon } from 'lucide-react';
import { documents } from '../data/documents';

const primaryLinks = [
{ to: '/dashboard', label: 'Overview', icon: LayoutGridIcon },
{ to: '/documents', label: 'Documents', icon: FileTextIcon },
{ to: '/branches', label: 'Branches', icon: GitBranchIcon },
{ to: '/activity', label: 'Activity', icon: ActivityIcon }];


function linkClass(isActive: boolean): string {
  return [
  'flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors duration-150 ease-serene',
  isActive ? 'bg-sage-50 text-sage-700' : 'text-ink-soft hover:bg-canvas hover:text-ink'].
  join(' ');
}

export function SideNav() {
  return (
    <nav aria-label="Primary" className="flex h-full flex-col gap-8 px-4 py-6">
      <ul className="space-y-1">
        {primaryLinks.map(({ to, label, icon: Icon }) =>
        <li key={to}>
            <NavLink to={to} className={({ isActive }) => linkClass(isActive)}>
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        )}
      </ul>

      <div>
        <p className="label-eyebrow px-3">Your documents</p>
        <ul className="mt-2 space-y-1">
          {documents.map((doc) =>
          <li key={doc.id}>
              <NavLink
              to={`/documents/${doc.id}`}
              className={({ isActive }) => linkClass(isActive)}
              title={doc.title}>
              
                <span className="truncate">{doc.reference}</span>
                {doc.reviewNeeded ?
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-clay-500" aria-label="Review needed" /> :
              null}
              </NavLink>
            </li>
          )}
        </ul>
      </div>

      <div className="mt-auto">
        <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)}>
          <SettingsIcon className="h-4 w-4" aria-hidden="true" />
          Settings
        </NavLink>
      </div>
    </nav>);

}