import React, { useEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { LoadingState } from './LoadingState';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';
import { useVaultData } from '../lib/vault-data';

export function AppShell() {
  const { user, loading } = useVaultData();
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();
  const previousPathname = useRef(location.pathname);

  useEffect(() => {
    if (previousPathname.current === location.pathname) return;
    previousPathname.current = location.pathname;

    const timeoutId = window.setTimeout(() => setNavOpen(false), 0);
    return () => window.clearTimeout(timeoutId);
  }, [location.pathname]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  if (loading) {
    return (
      <main className="min-h-full bg-canvas px-4 py-10">
        <LoadingState label="Loading workspace" rows={5} />
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-canvas">
      <TopBar onOpenSearch={() => setSearchOpen(true)} onToggleNav={() => setNavOpen((open) => !open)} />

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Mobile Navigation Drawer Backdrop */}
        {navOpen && (
          <div
            className="fixed inset-0 z-20 bg-ink/30 backdrop-blur-xs lg:hidden"
            onClick={() => setNavOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={`${
            navOpen ? 'fixed inset-y-0 left-0 z-30 flex w-72 flex-col shadow-lift' : 'hidden'
          } border-r border-line bg-surface lg:static lg:flex lg:w-60 lg:shadow-none`}
        >
          <div className="h-full overflow-hidden">
            <SideNav />
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
