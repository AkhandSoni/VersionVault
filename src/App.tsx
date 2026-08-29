import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { Activity } from './pages/Activity';
import { Branches } from './pages/Branches';
import { Dashboard } from './pages/Dashboard';
import { DocumentWorkspace } from './pages/DocumentWorkspace';
import { Documents } from './pages/Documents';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { NotFound } from './pages/NotFound';
import { Register } from './pages/Register';
import { Settings } from './pages/Settings';
import { VersionCompare } from './pages/VersionCompare';

interface AppProps {
  /** How AI interpretation resolves on the comparison screen. */
  aiExplanationState?: 'available' | 'processing' | 'failed';
  /** Density of the document collections. */
  documentView?: 'list' | 'grid';
}

export function App({ aiExplanationState = 'available', documentView = 'list' }: AppProps) {
  return (
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
    </BrowserRouter>);

}