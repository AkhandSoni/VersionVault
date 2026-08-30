import type {
  ActivityEvent,
  AIExplanation,
  ChangeCategory,
  ChangeSeverity,
  DocumentRecord,
  StructuredChange,
  Version,
} from '../types';
import { getBrowserSupabase } from './supabase-browser';

type ApiUser = { id: string; email: string; fullName?: string; createdAt: string };
type ApiMembership = { id: string; tenantId: string; role: 'OWNER' | 'CONTRIBUTOR' | 'VIEWER'; createdAt: string };
export type ApiCollaborator = {
  id: string;
  documentId: string;
  userId: string;
  role: 'OWNER' | 'CONTRIBUTOR' | 'VIEWER';
  addedBy: string;
  createdAt: string;
};
export type ApiProposal = {
  id: string;
  documentId: string;
  branchId?: string;
  sourceVersionId: string;
  agentId: string;
  taskDescription: string;
  proposedContent: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  resultingVersionId?: string;
  createdAt: string;
};
export type ApiDocument = {
  id: string;
  tenantId: string;
  title: string;
  currentVersionId: string | null;
  defaultBranchId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  accessRole?: 'OWNER' | 'CONTRIBUTOR' | 'VIEWER';
};
type ApiVersion = {
  id: string;
  documentId: string;
  parentVersionId: string | null;
  branchId: string;
  versionNumber: number;
  contentHash: string;
  versionHash?: string;
  mimeType: string;
  fileSize: number;
  createdBy: string;
  message?: string;
  status: string;
  createdAt: string;
};
export type ApiBranch = { id: string; name: string; headVersionId: string | null; baseVersionId: string | null };
export type ApiWorkspace = {
  document: ApiDocument;
  versions: ApiVersion[];
  branches: ApiBranch[];
  changes: ApiChange[];
  totalVersions: number;
  hasMoreVersions: boolean;
};
type ApiChange = {
  id: string;
  baseVersionId?: string;
  targetVersionId?: string;
  type: string;
  section?: string;
  oldValue?: string;
  newValue?: string;
  category?: string;
  severity?: string;
  confidence?: number;
};
type ApiActivity = {
  id: string;
  eventType: string;
  actorId: string;
  actorType: string;
  documentId?: string;
  versionId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};
export type ApiLineBlame = {
  lineNumber: number;
  content: string;
  versionId: string;
  versionNumber: number;
  authorId: string;
  authorType: 'human' | 'user' | 'ai_agent' | 'system';
  timestamp: string;
  commitMessage?: string;
};

const configuredBase = (
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  ''
).replace(/\/$/, '');
const apiBase = configuredBase || '';
const apiOrigin = configuredBase || 'http://localhost:3000';
let syncedAccessToken: string | null = null;

function apiUrl(path: string) {
  return `${apiBase}${path}`;
}

async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  const text = await response.text();
  let data: { message?: string; error?: string } | T | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as T;
    } catch {
      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
      }
      throw new Error('The server returned an invalid response. Please retry.');
    }
  }
  if (!response.ok) {
    const errorData = data as { message?: string; error?: string } | null;
    const message = errorData?.message || errorData?.error || `Request failed: ${response.status}`;
    // Keep the server's safe, stable error code visible to the UI. This makes
    // infrastructure/configuration failures actionable without exposing the
    // underlying database or storage error details.
    throw new Error(errorData?.error ? `${message} (${errorData.error})` : message);
  }
  return data as T;
}

export async function beginGoogleSignIn() {
  const supabase = getBrowserSupabase();
  const redirectTo = `${window.location.origin}/dashboard`;

  if (!supabase) {
    window.open(`${apiOrigin}/api/v1/auth/google?redirectTo=${encodeURIComponent(redirectTo)}`, '_self');
    return;
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    window.open(`${apiOrigin}/api/v1/auth/google?redirectTo=${encodeURIComponent(redirectTo)}`, '_self');
  }
}

export async function syncBrowserSession() {
  const supabase = getBrowserSupabase();
  if (!supabase) return false;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token || !session.refresh_token) {
    syncedAccessToken = null;
    return false;
  }

  if (syncedAccessToken === session.access_token) {
    return true;
  }

  await apiRequest('/api/v1/auth/session', {
    method: 'POST',
    body: JSON.stringify({
      accessToken: session.access_token,
      refreshToken: session.refresh_token,
    }),
  });
  syncedAccessToken = session.access_token;
  return true;
}

/**
 * Check the local Supabase session before making a round trip to `/auth/me`.
 * The provider uses this to avoid probing the API on public auth/landing
 * routes when the browser is clearly signed out.
 */
export async function hasBrowserSession(): Promise<boolean | null> {
  const supabase = getBrowserSupabase();
  if (!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return Boolean(session?.access_token);
}

export async function getMe() {
  return apiRequest<{ user: ApiUser; memberships: ApiMembership[]; tenantId: string | null }>('/api/v1/auth/me');
}

export async function getDocument(documentId: string) {
  return apiRequest<ApiDocument>(`/api/v1/documents/${documentId}`);
}

export async function login(email: string, password: string) {
  const response = await apiRequest<{ user: ApiUser }>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  const supabase = getBrowserSupabase();
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) {
      await syncBrowserSession();
    }
  }
  return response;
}

export async function register(email: string, password: string, fullName?: string) {
  const response = await apiRequest<{ user: ApiUser; tenantId?: string; needsEmailConfirmation?: boolean; message?: string }>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, fullName }),
  });
  if (!response.needsEmailConfirmation) {
    const supabase = getBrowserSupabase();
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (!error) {
        await syncBrowserSession();
      }
    }
  }
  return response;
}

export async function logout() {
  const supabase = getBrowserSupabase();
  await supabase?.auth.signOut();
  syncedAccessToken = null;
  return apiRequest('/api/v1/auth/logout', { method: 'POST' });
}

export async function listDocuments(tenantId: string) {
  return apiRequest<{ data: ApiDocument[] }>(`/api/v1/documents?tenantId=${encodeURIComponent(tenantId)}&pageSize=100`);
}

export async function createDocument(title: string, tenantId: string) {
  return apiRequest<ApiDocument>('/api/v1/documents', {
    method: 'POST',
    body: JSON.stringify({ title, tenantId }),
  });
}

export async function permanentlyDeleteDocument(documentId: string) {
  return apiRequest<{ message: string }>(`/api/v1/documents/${documentId}?permanent=true`, {
    method: 'DELETE',
  });
}

export async function listVersions(documentId: string) {
  return apiRequest<{ data: ApiVersion[] }>(`/api/v1/documents/${documentId}/versions?pageSize=100`);
}

export async function listBranches(documentId: string) {
  const response = await apiRequest<{ data: ApiBranch[] }>(`/api/v1/documents/${documentId}/branches`);
  return response.data;
}

export async function getWorkspace(documentId: string) {
  return apiRequest<ApiWorkspace>(`/api/v1/documents/${documentId}/workspace`);
}

export async function createBranch(documentId: string, name: string, baseVersionId: string, idempotencyKey?: string) {
  return apiRequest<ApiBranch>(`/api/v1/documents/${documentId}/branches`, {
    method: 'POST',
    body: JSON.stringify({ name, baseVersionId }),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export async function uploadVersion(
  documentId: string,
  file: File,
  message?: string,
  branchId?: string,
  idempotencyKey?: string,
) {
  const formData = new FormData();
  formData.set('file', file);
  if (message) formData.set('message', message);
  if (branchId) formData.set('branchId', branchId);

  return apiRequest<ApiVersion>(`/api/v1/documents/${documentId}/versions`, {
    method: 'POST',
    body: formData,
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export async function restoreVersion(versionId: string, message?: string, branchId?: string, idempotencyKey?: string) {
  return apiRequest<ApiVersion>(`/api/v1/versions/${versionId}/restore`, {
    method: 'POST',
    body: JSON.stringify({ message, branchId }),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export async function getDiff(baseVersionId: string, targetVersionId: string) {
  return apiRequest<{ changes: ApiChange[]; materialChangeCount: number }>(
    `/api/v1/versions/${baseVersionId}/diff/${targetVersionId}`,
  );
}

export async function downloadVersion(versionId: string): Promise<Blob> {
  const response = await fetch(apiUrl(`/api/v1/versions/${versionId}/content`), {
    credentials: 'include',
  });
  if (!response.ok) {
    const text = await response.text();
    let message = `Download failed: ${response.status}`;
    try {
      const data = JSON.parse(text) as { message?: string; error?: string };
      message = data.message || data.error || message;
    } catch {
      // Keep the status-based message when the server did not return JSON.
    }
    throw new Error(message);
  }
  return response.blob();
}

export async function getExplanation(baseVersionId: string, targetVersionId: string) {
  return apiRequest<{
    explanation: string;
    affectedAreas: string[];
    status: string;
    model?: string;
    createdAt: string;
  }>(`/api/v1/versions/${baseVersionId}/explanation/${targetVersionId}`);
}

export async function getActivity(documentId: string) {
  const response = await apiRequest<{ data: ApiActivity[] }>(`/api/v1/documents/${documentId}/activity?pageSize=100`);
  return response.data;
}

export async function listCollaborators(documentId: string) {
  const response = await apiRequest<{ data: ApiCollaborator[] }>(`/api/v1/documents/${documentId}/collaborators`);
  return response.data;
}

export async function getDocumentBlame(documentId: string) {
  const response = await apiRequest<{ data: ApiLineBlame[] }>(`/api/v1/documents/${documentId}/blame`);
  return response.data;
}

export async function addCollaborator(
  documentId: string,
  userId: string,
  role: 'CONTRIBUTOR' | 'VIEWER',
) {
  return apiRequest<ApiCollaborator>(`/api/v1/documents/${documentId}/collaborators`, {
    method: 'POST',
    body: JSON.stringify({ userId, role }),
  });
}

export async function askHistoryQuestion(documentId: string, question: string) {
  return apiRequest<{ answer: string; sources: string[] }>(`/api/v1/documents/${documentId}/qa`, {
    method: 'POST',
    body: JSON.stringify({ question }),
  });
}

export async function listProposals(documentId: string) {
  const response = await apiRequest<{ data: ApiProposal[] }>(`/api/v1/documents/${documentId}/proposals`);
  return response.data;
}

export async function reviewProposal(
  proposalId: string,
  action: 'approve' | 'reject',
  idempotencyKey?: string,
) {
  return apiRequest<ApiProposal>(`/api/v1/proposals/${proposalId}`, {
    method: 'POST',
    body: JSON.stringify({ action }),
    headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : undefined,
  });
}

export function mapChange(change: ApiChange): StructuredChange {
  const severity = mapSeverity(change.severity);
  return {
    id: change.id,
    section: change.section || change.category || change.type,
    previous: change.oldValue || 'Not present',
    current: change.newValue || 'Removed',
    category: mapCategory(change.category),
    severity,
    material: severity === 'high' || severity === 'medium',
    previousText: change.oldValue || '',
    currentText: change.newValue || '',
  };
}

export function mapExplanation(
  explanation: Awaited<ReturnType<typeof getExplanation>>,
  changeId: string,
  fromLabel: string,
  toLabel: string,
): AIExplanation {
  return {
    changeId,
    question: 'Why might this matter?',
    body: explanation.explanation,
    basedOn: `${fromLabel} -> ${toLabel}`,
    agent: 'Groq evidence explainer',
    model: explanation.model || 'configured model',
    approval: 'pending',
  };
}

export function mapDocument(
  doc: ApiDocument,
  versions: ApiVersion[],
  branches: ApiBranch[],
  changesByVersion: Map<string, StructuredChange[]>,
): DocumentRecord {
  const branchNameById = new Map(branches.map((branch) => [branch.id, branch.name]));
  const mappedVersions: Version[] = versions.map((version) => {
    const branch = branchNameById.get(version.branchId) || 'main';
    return {
      id: version.id,
      label: `V${version.versionNumber}`,
      parentId: version.parentVersionId,
      branch,
      author: version.createdBy,
      timestamp: version.createdAt,
      status: doc.currentVersionId === version.id ? 'current' : branch === 'main' ? 'main' : 'branch',
      hash: version.versionHash || version.contentHash,
      mimeType: version.mimeType,
      source: version.message || 'Uploaded revision',
      summary: version.message || `Version ${version.versionNumber} uploaded`,
      changes: changesByVersion.get(version.id) || [],
    };
  });

  return {
    id: doc.id,
    title: doc.title,
    reference: doc.id.slice(0, 8).toUpperCase(),
    role: doc.accessRole === 'VIEWER' ? 'Viewer' : doc.accessRole === 'CONTRIBUTOR' ? 'Editor' : 'Owner',
    branches: branches.length ? branches.map((branch) => branch.name) : ['main'],
    branchDetails: branches.map((branch) => ({
      id: branch.id,
      name: branch.name,
      headVersionId: branch.headVersionId,
      baseVersionId: branch.baseVersionId,
    })),
    currentVersionId: doc.currentVersionId || mappedVersions[0]?.id || '',
    updatedAt: doc.updatedAt,
    versionCount: mappedVersions.length,
    reviewNeeded: mappedVersions.some((version) => version.changes.some((change) => change.material)),
    integrity: 'verified',
    versions: mappedVersions.sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
  };
}

export function mapActivity(event: ApiActivity, titleByDocumentId: Map<string, string>): ActivityEvent {
  const metadata = event.metadata || {};
  return {
    id: event.id,
    type: mapActivityType(event.eventType),
    actor: event.actorType === 'ai_agent' ? 'AI agent' : event.actorId,
    timestamp: event.createdAt,
    documentId: event.documentId || '',
    documentTitle: titleByDocumentId.get(event.documentId || '') || 'Document',
    branch: String(metadata.branchName || metadata.branch || 'main'),
    detail: activityDetail(event),
  };
}

function mapSeverity(value?: string): ChangeSeverity {
  const normalized = value?.toLowerCase();
  if (normalized === 'high' || normalized === 'medium' || normalized === 'low') return normalized;
  return 'low';
}

function mapCategory(value?: string): ChangeCategory {
  switch (value) {
    case 'FINANCIAL':
      return 'Financial';
    case 'CONTRACTUAL':
      return 'Legal';
    case 'OPERATIONAL':
      return 'Operational';
    default:
      return 'Editorial';
  }
}

function mapActivityType(value: string): ActivityEvent['type'] {
  if (value === 'HUMAN_APPROVAL_RECORDED' || value === 'AI_PROPOSAL_APPROVED') return 'HUMAN_APPROVED';
  if (
    value === 'VERSION_CREATED' ||
    value === 'DOCUMENT_CREATED' ||
    value === 'DOCUMENT_DELETED' ||
    value === 'VERSION_READY' ||
    value === 'VERSION_FAILED' ||
    value === 'CHANGE_DETECTED' ||
    value === 'BRANCH_CREATED' ||
    value === 'AI_PROPOSAL_CREATED' ||
    value === 'AI_PROPOSAL_REJECTED' ||
    value === 'VERSION_RESTORED' ||
    value === 'PERMISSION_CHANGED' ||
    value === 'DOCUMENT_DOWNLOADED'
  ) {
    return value;
  }
  return 'CHANGE_DETECTED';
}

function activityDetail(event: ApiActivity): string {
  const metadata = event.metadata || {};
  if (event.eventType === 'DOCUMENT_CREATED') return `Document "${metadata.title || 'document'}" created`;
  if (event.eventType === 'DOCUMENT_DELETED') return `Document "${metadata.title || 'document'}" deleted`;
  if (event.eventType === 'VERSION_CREATED') return `Version ${metadata.versionNumber || ''} created`.trim();
  if (event.eventType === 'VERSION_READY') return `Version ${metadata.versionNumber || ''} is ready`.trim();
  if (event.eventType === 'VERSION_FAILED') return `Version ${metadata.versionNumber || ''} failed`.trim();
  if (event.eventType === 'BRANCH_CREATED') return `Branch "${metadata.branchName || 'branch'}" created`;
  if (event.eventType === 'VERSION_RESTORED') return `Restored from version ${metadata.restoredFromVersionId || ''}`.trim();
  if (event.eventType === 'PERMISSION_CHANGED') return `Permissions changed for ${metadata.targetUserId || 'a collaborator'}`;
  return event.eventType.replace(/_/g, ' ').toLowerCase();
}
