import React from 'react';
import { Link } from 'react-router-dom';
import { MenuIcon, SearchIcon, LayersIcon } from 'lucide-react';

interface TopBarProps {
  onOpenSearch: () => void;
  onToggleNav: () => void;
}

export function TopBar({ onOpenSearch, onToggleNav }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur shadow-xs">
      <div className="flex h-16 items-center gap-4 px-4 lg:px-8">
        <button
          type="button"
          onClick={onToggleNav}
          className="rounded-lg p-2 text-ink-soft transition-colors duration-150 ease-serene hover:bg-canvas lg:hidden"
          aria-label="Toggle navigation">
          
          <MenuIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link to="/dashboard" className="flex items-center gap-2.5 group">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 text-white shadow-xs transition-transform duration-150 group-hover:scale-105"
          >
            <LayersIcon className="h-4 w-4" />
          </span>
          <span className="font-serif text-lg font-semibold tracking-tight text-ink">
            Version<span className="text-orange-600">Vault</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={onOpenSearch}
          className="ml-auto flex w-full max-w-xs items-center gap-2 rounded-lg border border-line bg-canvas/80 px-3.5 py-2 text-sm text-ink-muted transition-all duration-150 ease-serene hover:border-orange-300 hover:bg-surface md:ml-8 md:mr-auto">
          
          <SearchIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
          <span className="truncate">Search documents…</span>
          <kbd className="ml-auto hidden rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted md:block">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-ink">Akhand Pratap</p>
            <p className="text-xs text-ink-muted">Owner · Legal Ops</p>
          </div>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-orange-100 to-amber-100 font-semibold text-orange-800 ring-2 ring-orange-200/80 shadow-xs">
            AP
          </span>
        </div>
      </div>
    </header>
  );
}