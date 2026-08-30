'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ActivityEvent, DocumentRecord, StructuredChange } from '../types';
import * as api from './api-client';

type VaultContextValue = {
  user: { id: string; email: string; fullName?: string } | null;
  memberships: { id: string; tenantId: string; role: 'OWNER' | 'CONTRIBUTOR' | 'VIEWER'; createdAt: string }[];
  tenantId: string | null;
  documents: DocumentRecord[];
  activityEvents: ActivityEvent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<boolean>;
  refreshDocument: (documentId: string) => Promise<DocumentRecord>;
  createDocument: (title: string, initialContent?: string) => Promise<DocumentRecord>;
  deleteDocument: (documentId: string) => Promise<void>;
  uploadRevision: (documentId: string, file: File, message?: string, branchId?: string, idempotencyKey?: string) => Promise<{
    versionNumber: number;
    status: string;
    branchId: string;
  }>;
  restoreRevision: (versionId: string, message?: string, branchId?: string, idempotencyKey?: string) => Promise<void>;
  createBranch: (documentId: string, name: string, baseVersionId: string, idempotencyKey?: string) => Promise<api.ApiBranch>;
  signOut: () => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

function mapWorkspace(workspace: api.ApiWorkspace): DocumentRecord {
  const changesByVersion = new Map<string, StructuredChange[]>();
  for (const change of workspace.changes) {
    if (!change.targetVersionId) continue;
    const current = changesByVersion.get(change.targetVersionId) ?? [];
    current.push(api.mapChange(change));
    changesByVersion.set(change.targetVersionId, current);
  }

  return api.mapDocument(workspace.document, workspace.versions, workspace.branches, changesByVersion);
}

export function VaultDataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VaultContextValue['user']>(null);
  const [memberships, setMemberships] = useState<VaultContextValue['memberships']>([]);
  const [tenantId, setTenantId] = useState<string | null>(() =>
    typeof window === 'undefined' ? null : window.localStorage.getItem('versionvault:tenantId'),
  );
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tenantIdRef = useRef(tenantId);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const refresh = useCallback(() => {
    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const refreshPromise = (async () => {
    setLoading(true);
    setError(null);
    try {
      let me: Awaited<ReturnType<typeof api.getMe>>;
      try {
        me = await api.getMe();
      } catch (err) {
        const synced = await api.syncBrowserSession();
        if (!synced) throw err;
        me = await api.getMe();
      }
      setUser(me.user);
      setMemberships(me.memberships);
      const membershipTenantIds = new Set(me.memberships.map((membership) => membership.tenantId));
      const storedTenantId = tenantIdRef.current && membershipTenantIds.has(tenantIdRef.current) ? tenantIdRef.current : null;
      const activeTenantId = storedTenantId || me.tenantId || me.memberships[0]?.tenantId || null;
      tenantIdRef.current = activeTenantId;
      setTenantId(activeTenantId);
      if (activeTenantId) {
        localStorage.setItem('versionvault:tenantId', activeTenantId);
      } else {
        localStorage.removeItem('versionvault:tenantId');
      }

      if (!activeTenantId) {
        setDocuments([]);
        setActivityEvents([]);
        return true;
      }

      try {
        const docResponse = await api.listDocuments(activeTenantId);
        const loadedDocuments = await Promise.all(
          docResponse.data.map((doc) => api.getWorkspace(doc.id).then(mapWorkspace)),
        );

        setDocuments(loadedDocuments);
        // Activity is supplementary to the document workspace. Do not make
        // every page and mutation wait for the complete audit feed.
        setLoading(false);

        const titleByDocumentId = new Map(loadedDocuments.map((doc) => [doc.id, doc.title]));
        void Promise.all(
          loadedDocuments.map(async (doc) => {
            try {
              const events = await api.getActivity(doc.id);
              return events.map((event) => api.mapActivity(event, titleByDocumentId));
            } catch {
              return [];
            }
          }),
        ).then((activityGroups) => {
          const activity = activityGroups.flat();
          setActivityEvents(activity.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
        });
      } catch (err) {
        setDocuments([]);
        setActivityEvents([]);
        setError(err instanceof Error ? err.message : 'Could not load vault data.');
      }
      return true;
    } catch (err) {
      setUser(null);
      setMemberships([]);
      setTenantId(null);
      setDocuments([]);
      setActivityEvents([]);
      localStorage.removeItem('versionvault:tenantId');
      setError(err instanceof Error ? err.message : 'Could not load vault data.');
      return false;
    } finally {
      setLoading(false);
      refreshPromiseRef.current = null;
    }
    })();

    refreshPromiseRef.current = refreshPromise;
    return refreshPromise;
  }, []);

  const loadDocumentRecord = useCallback(async (documentId: string) => {
    return mapWorkspace(await api.getWorkspace(documentId));
  }, []);

  const refreshDocument = useCallback(async (documentId: string) => {
    const document = await loadDocumentRecord(documentId);
    setDocuments((current) => {
      const exists = current.some((item) => item.id === document.id);
      return exists
        ? current.map((item) => (item.id === document.id ? document : item))
        : [document, ...current];
    });

    void api.getActivity(documentId).then((events) => {
      const titleByDocumentId = new Map([[document.id, document.title]]);
      const updatedEvents = events.map((event) => api.mapActivity(event, titleByDocumentId));
      setActivityEvents((current) => [
        ...current.filter((event) => event.documentId !== documentId),
        ...updatedEvents,
      ].sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
    }).catch(() => {
      // The document view remains usable when the supplementary audit feed is unavailable.
    });

    return document;
  }, [loadDocumentRecord]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void api.hasBrowserSession().then((hasSession) => {
        // A missing browser Supabase client can still mean the API owns the
        // session (for example in a server-managed deployment), so preserve
        // the normal probe in that case.
        if (hasSession === false) {
          setLoading(false);
          return;
        }
        void refresh();
      }).catch(() => {
        void refresh();
      });
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [refresh]);

  const value = useMemo<VaultContextValue>(() => ({
    user,
    memberships,
    tenantId,
    documents,
    activityEvents,
    loading,
    error,
    refresh,
    refreshDocument,
    async createDocument(title, initialContent) {
      if (!tenantId) throw new Error('No workspace available for this account.');
      const doc = await api.createDocument(title, tenantId);
      if (initialContent?.trim()) {
        const file = new File([initialContent], `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`, {
          type: 'text/markdown',
        });
        await api.uploadVersion(doc.id, file, 'Initial baseline');
      }
      return refreshDocument(doc.id);
    },
    async deleteDocument(documentId) {
      await api.permanentlyDeleteDocument(documentId);
      // Update the shared client state immediately after the server confirms
      // deletion so the documents list does not require a full reload.
      setDocuments((current) => current.filter((document) => document.id !== documentId));
      setActivityEvents((current) => current.filter((event) => event.documentId !== documentId));
    },
    async uploadRevision(documentId, file, message, branchId, idempotencyKey) {
      const version = await api.uploadVersion(documentId, file, message, branchId, idempotencyKey);
      // The immutable version is already authoritative when the API returns.
      // Revalidate the richer timeline in the background so the upload action
      // is not held hostage by a second full workspace read.
      void refreshDocument(documentId).catch(() => undefined);
      return {
        versionNumber: version.versionNumber,
        status: version.status,
        branchId: version.branchId,
      };
    },
    async restoreRevision(versionId, message, branchId, idempotencyKey) {
      await api.restoreVersion(versionId, message, branchId, idempotencyKey);
      const refreshed = documents.find((document) => document.versions.some((item) => item.id === versionId));
      if (refreshed) void refreshDocument(refreshed.id).catch(() => undefined);
    },
    async createBranch(documentId, name, baseVersionId, idempotencyKey) {
      const branch = await api.createBranch(documentId, name, baseVersionId, idempotencyKey);
      void refreshDocument(documentId).catch(() => undefined);
      return branch;
    },
    async signOut() {
      await api.logout();
      localStorage.removeItem('versionvault:tenantId');
      setUser(null);
      setMemberships([]);
      setTenantId(null);
      setDocuments([]);
      setActivityEvents([]);
    },
  }), [activityEvents, documents, error, loading, memberships, refresh, refreshDocument, tenantId, user]);

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVaultData() {
  const value = useContext(VaultContext);
  if (!value) throw new Error('useVaultData must be used inside VaultDataProvider');
  return value;
}
