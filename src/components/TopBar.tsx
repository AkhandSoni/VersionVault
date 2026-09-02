import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDownIcon,
  LogOutIcon,
  MenuIcon,
  SearchIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from 'lucide-react';
import { useVaultData } from '../lib/vault-data';
import { VisionVaultLogo } from './VisionVaultLogo';

interface TopBarProps {
  onOpenSearch: () => void;
  onToggleNav: () => void;
}

export function TopBar({ onOpenSearch, onToggleNav }: TopBarProps) {
  const navigate = useNavigate();
  const { user, memberships, signOut } = useVaultData();
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const displayName = user?.fullName || user?.email.split('@')[0] || 'Signed in user';
  const displayEmail = user?.email || '';
  const displayRole = memberships[0]?.role || 'OWNER';
  const roleLabel = displayRole.charAt(0) + displayRole.slice(1).toLowerCase();
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'VV';

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

  async function handleLogout() {
    setProfileOpen(false);
    await signOut();
    navigate('/login');
  }

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-surface/95 backdrop-blur shadow-xs">
      <div className="flex h-16 min-w-0 items-center gap-3 px-4 sm:gap-4 lg:px-8">
        <button
          type="button"
          onClick={onToggleNav}
          className="rounded-lg p-2 text-ink-soft transition-colors duration-150 ease-serene hover:bg-canvas lg:hidden"
          aria-label="Toggle navigation">
          <MenuIcon className="h-5 w-5" aria-hidden="true" />
        </button>

        <Link to="/dashboard" className="group flex shrink-0 items-center gap-2.5">
          <VisionVaultLogo compact className="transition-transform duration-150 group-hover:scale-[1.02]" />
        </Link>

        <button
          type="button"
          onClick={onOpenSearch}
          className="ml-auto hidden min-w-0 flex-1 items-center gap-2 rounded-lg border border-line bg-canvas/80 px-3.5 py-2 text-sm text-ink-muted transition-all duration-150 ease-serene hover:border-orange-300 hover:bg-surface sm:flex sm:max-w-[18rem] md:ml-8 md:mr-auto lg:max-w-sm">
          <SearchIcon className="h-4 w-4 text-ink-muted" aria-hidden="true" />
          <span className="truncate">Search documents...</span>
          <kbd className="ml-auto hidden rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-ink-muted md:block">
            Ctrl K
          </kbd>
        </button>

        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            aria-expanded={profileOpen}
            aria-haspopup="true"
            className="flex max-w-[13rem] items-center gap-2 rounded-xl p-1.5 transition-colors hover:bg-canvas focus:outline-none focus:ring-2 focus:ring-orange-500/50 sm:max-w-xs sm:gap-3">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-semibold leading-tight text-ink">{displayName}</p>
              <p className="text-xs text-ink-muted">{roleLabel} workspace</p>
            </div>
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-tr from-orange-100 to-amber-100 font-semibold text-orange-800 ring-2 ring-orange-200/80 shadow-xs">
              {initials}
            </span>
            <ChevronDownIcon
              className={`h-4 w-4 shrink-0 text-ink-muted transition-transform duration-150 ${
                profileOpen ? 'rotate-180 text-orange-600' : ''
              }`}
            />
          </button>

          <AnimatePresence>
            {profileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 4 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute right-0 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 shadow-lift z-50 overflow-hidden">
                <div className="border-b border-line px-3.5 py-3">
                  <p className="text-sm font-semibold text-ink">{displayName}</p>
                  <p className="text-xs text-ink-muted truncate">{displayEmail}</p>
                  <div className="mt-2 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800 border border-orange-200">
                      <ShieldCheckIcon className="h-3 w-3 text-orange-600" />
                      Tenant {roleLabel}
                    </span>
                  </div>
                </div>

                <div className="py-1">
                  <Link
                    to="/settings"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-orange-50/80 hover:text-orange-950">
                    <SettingsIcon className="h-4 w-4 text-ink-muted" />
                    <span>Settings & Preferences</span>
                  </Link>

                  <Link
                    to="/activity"
                    onClick={() => setProfileOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-orange-50/80 hover:text-orange-950">
                    <ShieldCheckIcon className="h-4 w-4 text-ink-muted" />
                    <span>Audit Log & Activity</span>
                  </Link>
                </div>

                <div className="border-t border-line pt-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50">
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
