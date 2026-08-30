'use client';

import React, { Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { VaultDataProvider } from './lib/vault-data';

// Keep the initial browser chunk small. Each route downloads its own view on
// demand, so landing/auth screens do not pay for the workspace, diff engine,
// or admin dialogs before the user needs them.
const AppShell = React.lazy(() => import('./components/AppShell').then(({ AppShell: component }) => ({ default: component })));
const Activity = React.lazy(() => import('./views/Activity').then(({ Activity: component }) => ({ default: component })));
const Branches = React.lazy(() => import('./views/Branches').then(({ Branches: component }) => ({ default: component })));
const Dashboard = React.lazy(() => import('./views/Dashboard').then(({ Dashboard: component }) => ({ default: component })));
const DocumentWorkspace = React.lazy(() => import('./views/DocumentWorkspace').then(({ DocumentWorkspace: component }) => ({ default: component })));
const Documents = React.lazy(() => import('./views/Documents').then(({ Documents: component }) => ({ default: component })));
const Landing = React.lazy(() => import('./views/Landing').then(({ Landing: component }) => ({ default: component })));
const Login = React.lazy(() => import('./views/Login').then(({ Login: component }) => ({ default: component })));
const NotFound = React.lazy(() => import('./views/NotFound').then(({ NotFound: component }) => ({ default: component })));
const Register = React.lazy(() => import('./views/Register').then(({ Register: component }) => ({ default: component })));
const Settings = React.lazy(() => import('./views/Settings').then(({ Settings: component }) => ({ default: component })));
const VersionCompare = React.lazy(() => import('./views/VersionCompare').then(({ VersionCompare: component }) => ({ default: component })));

function RouteLoading() {
  return (
    <main className="min-h-full bg-canvas px-4 py-10" role="status" aria-live="polite">
      <div className="mx-auto max-w-6xl animate-pulse rounded-2xl border border-line bg-surface p-8 shadow-xs">
        <div className="h-3 w-24 rounded bg-orange-100" />
        <div className="mt-4 h-8 w-72 rounded bg-canvas" />
        <div className="mt-8 h-32 rounded-xl bg-canvas" />
      </div>
    </main>
  );
}

interface AppProps {
  /** How AI interpretation resolves on the comparison screen. */
  aiExplanationState?: 'available' | 'processing' | 'failed';
  /** Density of the document collections. */
  documentView?: 'list' | 'grid';
}

export function App({ aiExplanationState = 'available', documentView = 'list' }: AppProps) {
  return (
    <VaultDataProvider>
      <BrowserRouter>
        <Suspense fallback={<RouteLoading />}>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            <Route element={<AppShell />}>
              <Route path="/dashboard" element={<Dashboard documentView={documentView} />} />
              <Route path="/documents" element={<Documents documentView={documentView} />} />
              <Route path="/documents/:documentId" element={<DocumentWorkspace />} />
              <Route
                path="/documents/:documentId/compare/:versionId"
                element={<VersionCompare aiStatus={aiExplanationState} />} />
              <Route
                path="/documents/:documentId/compare"
                element={<DocumentWorkspace />} />
              <Route path="/documents/:documentId/activity" element={<Activity />} />
              <Route path="/documents/:documentId/branches" element={<Branches />} />

              <Route path="/branches" element={<Branches />} />
              <Route path="/activity" element={<Activity />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/app" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </VaultDataProvider>);

}
