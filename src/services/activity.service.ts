// ============================================================
// VersionVault — Activity / Audit Service (Person 1)
// Append-only audit trail.
// ============================================================

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/errors';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';
import { assertDocumentCanRead, assertTenantMember } from './authorization.service';
import type { ActivityEvent, ActivityEventType } from '@/types/domain';

export async function logEvent(params: {
  tenantId: string;
  documentId?: string;
  versionId?: string;
  actorId: string;
  actorType: 'human' | 'ai_agent';
  eventType: ActivityEventType;
  metadata?: Record<string, unknown>;
}): Promise<ActivityEvent> {
  const supabase = await createClient();

  const insertData = {
    tenant_id: params.tenantId,
    document_id: params.documentId ?? null,
    version_id: params.versionId ?? null,
    actor_id: params.actorId,
    actor_type: params.actorType,
    event_type: params.eventType,
    metadata: params.metadata ?? null,
  };

  const { data, error } = await supabase
    .from('activity_events')
    .insert(insertData)
    .select()
    .single();

  if (error || !data) {
    throw new AppError(`Failed to log activity event: ${error?.message}`, 'ACTIVITY_LOG_FAILED', 500);
  }

  return {
    id: data.id,
    tenantId: data.tenant_id,
    documentId: data.document_id,
    versionId: data.version_id,
    actorId: data.actor_id,
    actorType: data.actor_type,
    eventType: data.event_type as ActivityEventType,
    metadata: (data.metadata as Record<string, unknown>) ?? undefined,
    createdAt: data.created_at,
  };
}

export async function getDocumentActivity(
  userId: string,
  documentId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<ActivityEvent[]> {
  await assertDocumentCanRead(userId, documentId);
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('document_id', documentId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError(`Failed to fetch document activity: ${error.message}`, 'ACTIVITY_FETCH_FAILED', 500);
  }

  return (data || []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    documentId: row.document_id,
    versionId: row.version_id,
    actorId: row.actor_id,
    actorType: row.actor_type,
    eventType: row.event_type as ActivityEventType,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function getAuditTrail(
  userId: string,
  tenantId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<ActivityEvent[]> {
  await assertTenantMember(userId, tenantId);
  const supabase = await createServiceClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error } = await supabase
    .from('activity_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError(`Failed to fetch audit trail: ${error.message}`, 'AUDIT_TRAIL_FETCH_FAILED', 500);
  }

  return (data || []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    documentId: row.document_id,
    versionId: row.version_id,
    actorId: row.actor_id,
    actorType: row.actor_type,
    eventType: row.event_type as ActivityEventType,
    metadata: (row.metadata as Record<string, unknown>) ?? undefined,
    createdAt: row.created_at,
  }));
}
