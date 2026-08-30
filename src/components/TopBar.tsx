import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { MenuIcon, SearchIcon, LayersIcon, SettingsIcon, LogOutIcon, ChevronDownIcon, ShieldCheckIcon } from 'lucide-react';

interface TopBarProps {
  onOpenSearch: () => void;
  onToggleNav: () => void;
}

export function TopBar({ onOpenSearch, onToggleNav }: TopBarProps) {
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    }
    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [profileOpen]);

  function handleLogout() {
    setProfileOpen(false);
    navigate('/login');
  }

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

        {/* Profile Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            className="flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-canvas focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink leading-tight">Akhand Pratap</p>
              <p className="text-xs text-ink-muted">Owner · Legal Ops</p>
            </div>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-orange-100 to-amber-100 font-semibold text-orange-800 ring-2 ring-orange-200/80 shadow-xs">
              AP
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 text-ink-muted transition-transform duration-150 ${
                profileOpen ? 'rotate-180 text-orange-600' : ''
              }`}
            />
          </button>

          {/* Animated Dropdown Menu */}
          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-lift z-50 overflow-hidden"
              >
                {/* User Header Info */}
                <div className="border-b border-line px-3.5 py-3">
                  <p className="text-sm font-semibold text-ink">Akhand Pratap</p>
                  <p className="text-xs text-ink-muted truncate">akhand@versionvault.app</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800 border border-orange-200">
                      <ShieldCheckIcon className="h-3 w-3 text-orange-600" />
                      Tenant Owner
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-orange-50/80 hover:text-orange-950"
                  >
                    <SettingsIcon className="h-4 w-4 text-ink-muted" />
                    <span>Settings & Preferences</span>
                  </Link>

                  <Link
                    to="/activity"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-orange-50/80 hover:text-orange-950"
                  >
                    <LayersIcon className="h-4 w-4 text-ink-muted" />
                    <span>Audit Log & Activity</span>
                  </Link>
                </div>

                {/* Divider & Logout */}
                <div className="border-t border-line pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50"
                  >
                    <LogOutIcon className="h-4 w-4 text-rose-600" />
                    <span>Log out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}