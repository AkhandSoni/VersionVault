import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { CommandPalette } from './CommandPalette';
import { SideNav } from './SideNav';
import { TopBar } from './TopBar';

export function AppShell() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setNavOpen(false);
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

  return (
    <div className="min-h-full w-full bg-canvas">
      <TopBar onOpenSearch={() => setSearchOpen(true)} onToggleNav={() => setNavOpen((open) => !open)} />

      <div className="mx-auto flex w-full max-w-[1600px]">
        <aside
          className={`${
          navOpen ? 'block' : 'hidden'} w-full shrink-0 border-b border-line bg-surface lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)] lg:w-60 lg:border-b-0 lg:border-r`
          }>
          
          <SideNav />
        </aside>

        <main className="min-w-0 flex-1 px-4 py-8 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>);

}