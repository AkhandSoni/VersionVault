import React from 'react';
import { Link } from 'react-router-dom';
import { MenuIcon, SearchIcon } from 'lucide-react';

interface TopBarProps {
  onOpenSearch: () => void;
  onToggleNav: () => void;
}

export function TopBar({ onOpenSearch, onToggleNav }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/90 backdrop-blur">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
        <button
          type="button"
          onClick={onToggleNav}
          className="rounded-lg p-2 text-ink-soft transition-colors duration-150 ease-serene hover:bg-canvas lg:hidden"
          aria-label="Toggle navigation">
          
          <MenuIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5">
          <span aria-hidden="true" className="h-6 w-6 rounded-md border border-sage-200 bg-sage-50" />
          <span className="font-serif text-lg tracking-tight text-ink">VersionVault</span>
        </Link>

        <button
          type="button"
          onClick={onOpenSearch}
          className="ml-auto flex w-full max-w-xs items-center gap-2 rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink-muted transition-colors duration-150 ease-serene hover:border-sage-200 md:ml-8 md:mr-auto">
          
          <SearchIcon className="h-4 w-4" aria-hidden="true" />
          <span className="truncate">Search documents…</span>
          <kbd className="ml-auto hidden rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted md:block">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm text-ink">Akhand Pratap</p>
            <p className="text-xs text-ink-muted">Owner · Legal Ops</p>
          </div>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-sage-100 font-medium text-sage-700">
            
            AP
          </span>
        </div>
      </div>
    </header>);

}