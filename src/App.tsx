import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { VaultDataProvider } from './lib/vault-data';
import { Activity } from './views/Activity';
import { Branches } from './views/Branches';
import { Dashboard } from './views/Dashboard';
import { DocumentWorkspace } from './views/DocumentWorkspace';
import { Documents } from './views/Documents';
import { Landing } from './views/Landing';
import { Login } from './views/Login';
import { NotFound } from './views/NotFound';
import { Register } from './views/Register';
import { Settings } from './views/Settings';
import { VersionCompare } from './views/VersionCompare';

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

            <Route path="/branches" element={<Branches />} />
            <Route path="/activity" element={<Activity />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/app" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </VaultDataProvider>);

}
