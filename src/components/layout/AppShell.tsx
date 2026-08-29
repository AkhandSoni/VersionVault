'use client';

// ============================================================
// VersionVault — App Shell (Person 3)
// Global layout container with topbar, sidebar & main workspace
// ============================================================

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigationItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Documents',
      href: '/dashboard',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
    },
    {
      name: 'Settings',
      href: '/settings',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-300">
      {/* Top Header */}
      <header className="sticky top-0 z-40 h-14 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="md:hidden p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-md transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link href="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-7 h-7 rounded-md bg-zinc-900 border border-zinc-700 flex items-center justify-center text-zinc-200 group-hover:border-zinc-500 transition-colors">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="font-semibold tracking-tight text-sm text-zinc-100">
              VersionVault
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-950/50 text-emerald-400 border border-emerald-800/40">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            SHA-256 INTEGRITY VERIFIED
          </div>
        </div>

        {/* Global Search / Command Bar trigger */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              readOnly
              placeholder="Search documents or hashes... (⌘K)"
              className="w-full bg-zinc-900/90 hover:bg-zinc-900 border border-zinc-800 focus:border-zinc-600 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-300 placeholder:text-zinc-500 cursor-pointer transition-colors"
            />
          </div>
        </div>

        {/* User / Actions */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-medium text-zinc-300">
              U
            </div>
            <span className="text-xs text-zinc-400 hidden sm:inline-block">User</span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex">
        {/* Sidebar */}
        <aside
          className={`
            fixed md:static inset-y-0 left-0 z-30
            w-60 bg-zinc-950 border-r border-zinc-800/80
            flex flex-col pt-14 md:pt-0 transform
            transition-transform duration-200 ease-in-out
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
        >
          <div className="p-3 space-y-6 flex-1 overflow-y-auto">
            {/* Primary Nav */}
            <nav className="space-y-1">
              <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Navigation
              </div>
              {navigationItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/dashboard' && Boolean(pathname?.startsWith(item.href)));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-2.5 px-3 py-2 rounded-md text-xs font-medium transition-colors
                      ${
                        isActive
                          ? 'bg-zinc-800/80 text-zinc-100 border border-zinc-700/60'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
                      }
                    `}
                  >
                    <span className={isActive ? 'text-emerald-400' : 'text-zinc-400'}>
                      {item.icon}
                    </span>
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Scope / Projects */}
            <div className="space-y-1">
              <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-zinc-500">
                Authorized Scope
              </div>
              <div className="px-3 py-2 text-xs text-zinc-500 bg-zinc-900/30 rounded-md border border-zinc-800/40">
                <span className="block font-medium text-zinc-400">Workspace</span>
                <span className="text-[11px] text-zinc-500">Default Scope</span>
              </div>
            </div>
          </div>

          {/* Forensic System Footer */}
          <div className="p-3 border-t border-zinc-800/80">
            <div className="text-[10px] font-mono text-zinc-500 flex items-center justify-between">
              <span>EVIDENCE FIRST</span>
              <span className="text-zinc-600">v0.1.0</span>
            </div>
          </div>
        </aside>

        {/* Mobile backdrop */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-xs md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Main Content Workspace */}
        <main className="flex-1 min-w-0 bg-zinc-950 overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppShell;
