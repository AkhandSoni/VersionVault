// ============================================================
// VersionVault - Authorization Service
// Centralized guards for service-role Supabase access.
// ============================================================

import { createServiceClient } from '@/lib/supabase/server';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import type { Collaborator, Document, Membership } from '@/types/domain';

type Role = Membership['role'];

type DocumentAccessContext = {
  document: Document;
  membershipRole: Role | null;
  collaboratorRole: Role | null;
};

type DocumentRow = {
  id: string;
  tenant_id: string;
  title: string;
  current_version_id: string | null;
  default_branch_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

const EDIT_ROLES = new Set<Role>(['OWNER', 'CONTRIBUTOR']);

function mapDocument(row: DocumentRow): Document {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    title: row.title,
    currentVersionId: row.current_version_id,
    defaultBranchId: row.default_branch_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function assertTenantMember(userId: string, tenantId: string): Promise<Role> {
  const supabase = await createServiceClient();

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single();

  if (!membership) {
    throw new NotFoundError('Workspace not found');
  }

  return membership.role as Role;
}

export async function assertTenantCanEdit(userId: string, tenantId: string): Promise<Role> {
  const role = await assertTenantMember(userId, tenantId);

  if (!EDIT_ROLES.has(role)) {
    throw new ForbiddenError('You do not have permission to edit this workspace');
  }

  return role;
}

export async function getDocumentAccessContext(
  userId: string,
  documentId: string,
): Promise<DocumentAccessContext> {
  const supabase = await createServiceClient();

  const { data: docRow, error: docError } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (docError || !docRow) {
    throw new NotFoundError('Document not found');
  }

  const document = mapDocument(docRow as DocumentRow);

  const [{ data: membership }, { data: collaborator }] = await Promise.all([
    supabase
      .from('memberships')
      .select('role')
      .eq('tenant_id', document.tenantId)
      .eq('user_id', userId)
      .single(),
    supabase
      .from('collaborators')
      .select('role')
      .eq('document_id', document.id)
      .eq('user_id', userId)
      .single(),
  ]);

  if (!membership && !collaborator) {
    throw new NotFoundError('Document not found');
  }

  return {
    document,
    membershipRole: (membership?.role as Role | undefined) ?? null,
    collaboratorRole: (collaborator?.role as Collaborator['role'] | undefined) ?? null,
  };
}

export async function assertDocumentCanRead(
  userId: string,
  documentId: string,
): Promise<DocumentAccessContext> {
  return getDocumentAccessContext(userId, documentId);
}

export async function assertDocumentCanEdit(
  userId: string,
  documentId: string,
): Promise<DocumentAccessContext> {
  const context = await getDocumentAccessContext(userId, documentId);

  if (!EDIT_ROLES.has(context.membershipRole as Role) && !EDIT_ROLES.has(context.collaboratorRole as Role)) {
    throw new ForbiddenError('You do not have permission to edit this document');
  }

  return context;
}

export async function assertDocumentOwner(
  userId: string,
  documentId: string,
): Promise<DocumentAccessContext> {
  const context = await getDocumentAccessContext(userId, documentId);
  const isOwner =
    context.document.createdBy === userId ||
    context.membershipRole === 'OWNER' ||
    context.collaboratorRole === 'OWNER';

  if (!isOwner) {
    throw new ForbiddenError('Only owners can manage document permissions');
  }

  return context;
}
