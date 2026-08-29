// ============================================================
// VersionVault — Activity / Audit Service (Person 1)
// ============================================================

// TODO: Implement audit event recording and retrieval
//   - log state-changing events
//   - get activity for a document
//   - get full audit trail

import type { ActivityEvent, ActivityEventType } from '@/types';

export async function logEvent(params: {
  tenantId: string;
  documentId?: string;
  versionId?: string;
  actorId: string;
  actorType: 'human' | 'ai_agent';
  eventType: ActivityEventType;
  metadata?: Record<string, unknown>;
}): Promise<ActivityEvent> {
  void params;
  throw new Error('activity.logEvent not implemented');
}

export async function getDocumentActivity(
  _userId: string,
  _documentId: string,
  _page?: number,
  _pageSize?: number,
): Promise<ActivityEvent[]> {
  throw new Error('activity.getDocumentActivity not implemented');
}

export async function getAuditTrail(
  _userId: string,
  _tenantId: string,
  _page?: number,
  _pageSize?: number,
): Promise<ActivityEvent[]> {
  throw new Error('activity.getAuditTrail not implemented');
}
