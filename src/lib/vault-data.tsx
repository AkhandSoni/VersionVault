import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  createDocument: (title: string, initialContent?: string) => Promise<DocumentRecord>;
  uploadRevision: (documentId: string, file: File, message?: string, branchId?: string) => Promise<void>;
  restoreRevision: (versionId: string, message?: string, branchId?: string) => Promise<void>;
  createBranch: (documentId: string, name: string, baseVersionId: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const VaultContext = createContext<VaultContextValue | null>(null);

export function VaultDataProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<VaultContextValue['user']>(null);
  const [memberships, setMemberships] = useState<VaultContextValue['memberships']>([]);
  const [tenantId, setTenantId] = useState<string | null>(localStorage.getItem('versionvault:tenantId'));
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [activityEvents, setActivityEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
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
      const storedTenantId = tenantId && membershipTenantIds.has(tenantId) ? tenantId : null;
      const activeTenantId = storedTenantId || me.tenantId || me.memberships[0]?.tenantId || null;
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
          docResponse.data.map(async (doc) => {
            const [versionResponse, branches] = await Promise.all([
              api.listVersions(doc.id),
              api.listBranches(doc.id),
            ]);

            const changesByVersion = new Map<string, StructuredChange[]>();
            await Promise.all(
              versionResponse.data
                .filter((version) => version.parentVersionId)
                .map(async (version) => {
                  try {
                    const diff = await api.getDiff(version.parentVersionId as string, version.id);
                    changesByVersion.set(version.id, diff.changes.map(api.mapChange));
                  } catch {
                    changesByVersion.set(version.id, []);
                  }
                }),
            );

            return api.mapDocument(doc, versionResponse.data, branches, changesByVersion);
          }),
        );

        const titleByDocumentId = new Map(loadedDocuments.map((doc) => [doc.id, doc.title]));
        const activity = (
          await Promise.all(
            loadedDocuments.map(async (doc) => {
              try {
                const events = await api.getActivity(doc.id);
                return events.map((event) => api.mapActivity(event, titleByDocumentId));
              } catch {
                return [];
              }
            }),
          )
        ).flat();

        setDocuments(loadedDocuments);
        setActivityEvents(activity.sort((a, b) => b.timestamp.localeCompare(a.timestamp)));
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
    }
  }, [tenantId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refresh();
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
    async createDocument(title, initialContent) {
      if (!tenantId) throw new Error('No workspace available for this account.');
      const doc = await api.createDocument(title, tenantId);
      if (initialContent?.trim()) {
        const file = new File([initialContent], `${title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`, {
          type: 'text/markdown',
        });
        await api.uploadVersion(doc.id, file, 'Initial baseline');
      }
      await refresh();
      const updated = documents.find((item) => item.id === doc.id);
      return updated || api.mapDocument(doc, [], [], new Map());
    },
    async uploadRevision(documentId, file, message, branchId) {
      await api.uploadVersion(documentId, file, message, branchId);
      await refresh();
    },
    async restoreRevision(versionId, message, branchId) {
      await api.restoreVersion(versionId, message, branchId);
      await refresh();
    },
    async createBranch(documentId, name, baseVersionId) {
      await api.createBranch(documentId, name, baseVersionId);
      await refresh();
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
  }), [activityEvents, documents, error, loading, memberships, refresh, tenantId, user]);

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVaultData() {
  const value = useContext(VaultContext);
  if (!value) throw new Error('useVaultData must be used inside VaultDataProvider');
  return value;
}
