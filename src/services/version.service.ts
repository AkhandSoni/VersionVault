// ============================================================
// VersionVault — Version Service (Person 1)
// Immutable snapshot management, SHA-256 integrity chaining,
// and private storage integration.
// ============================================================

import { createServiceClient } from '@/lib/supabase/server';
import { NotFoundError, AppError } from '@/lib/errors';
import { validateUpload } from '@/lib/validation';
import { sha256, computeVersionHash } from '@/lib/hash';
import { DEFAULT_PAGE_SIZE, SIGNED_URL_EXPIRY_SECONDS } from '@/lib/constants';
import { uploadObject, getSignedUrl } from './storage.service';
import { getDocument } from './document.service';
import { logEvent } from './activity.service';
import { setVersionContent, getStoredVersionContent } from './diff.service';
import type { Version } from '@/types/domain';
import type { PaginatedResponse, RestoreVersionRequest } from '@/types';

export async function createVersion(
  userId: string,
  documentId: string,
  file: Buffer,
  mimeType: string,
  message?: string,
  branchId?: string,
  parentVersionId?: string,
): Promise<Version> {
  // 1. Validate file size and MIME type
  validateUpload(file, mimeType);

  // 2. Compute deterministic SHA-256 contentHash
  const contentHash = sha256(file);

  // 3. Verify document exists and user is authorized
  const doc = await getDocument(userId, documentId);
  if (!doc) {
    throw new NotFoundError('Document not found');
  }

  const supabase = await createServiceClient();

  // 4. Resolve branch (use provided branchId or document's default branch)
  let targetBranchId = branchId;
  if (!targetBranchId) {
    if (doc.defaultBranchId) {
      targetBranchId = doc.defaultBranchId;
    } else {
      const { data: defaultBranch } = await supabase
        .from('branches')
        .select('id')
        .eq('document_id', documentId)
        .eq('name', 'main')
        .single();

      targetBranchId = defaultBranch?.id;
    }
  }

  if (!targetBranchId) {
    throw new AppError('No branch found for document', 'BRANCH_NOT_FOUND', 400);
  }

  // 5. Resolve parent version and version number
  let parentId = parentVersionId ?? null;
  let parentVersionHash: string | null = null;
  let nextVersionNumber = 1;

  if (!parentId) {
    const { data: branchData } = await supabase
      .from('branches')
      .select('head_version_id')
      .eq('id', targetBranchId)
      .single();

    parentId = branchData?.head_version_id ?? null;
  }

  if (parentId) {
    const { data: parentVer } = await supabase
      .from('versions')
      .select('version_number, version_hash')
      .eq('id', parentId)
      .single();

    if (parentVer) {
      nextVersionNumber = parentVer.version_number + 1;
      parentVersionHash = parentVer.version_hash ?? null;
    }
  }

  // 6. Compute chained tamper-evident versionHash
  const versionHash = computeVersionHash(contentHash, parentVersionHash);

  // 7. Store file in private Supabase Storage bucket
  const storageObjectId = crypto.randomUUID();
  const versionId = crypto.randomUUID();

  const { path: storagePath } = await uploadObject(
    doc.tenantId,
    documentId,
    versionId,
    storageObjectId,
    file,
    mimeType,
  );

  // 8. Insert record in storage_objects table
  await supabase.from('storage_objects').insert({
    id: storageObjectId,
    tenant_id: doc.tenantId,
    document_id: documentId,
    version_id: versionId,
    storage_path: storagePath,
    mime_type: mimeType,
    file_size: file.byteLength,
    content_hash: contentHash,
  });

  // 9. Insert version snapshot in versions table (status: READY = IMMUTABLE)
  const { data: versionRecord, error: versionError } = await supabase
    .from('versions')
    .insert({
      id: versionId,
      document_id: documentId,
      parent_version_id: parentId,
      branch_id: targetBranchId,
      version_number: nextVersionNumber,
      content_hash: contentHash,
      version_hash: versionHash,
      storage_object_id: storageObjectId,
      mime_type: mimeType,
      file_size: file.byteLength,
      created_by: userId,
      message: message ?? null,
      status: 'READY',
    })
    .select()
    .single();

  if (versionError || !versionRecord) {
    throw new AppError(`Failed to create version snapshot: ${versionError?.message}`, 'VERSION_CREATE_FAILED', 400);
  }

  // 10. Advance branch HEAD and document currentVersionId
  await supabase
    .from('branches')
    .update({ head_version_id: versionId })
    .eq('id', targetBranchId);

  await supabase
    .from('documents')
    .update({ current_version_id: versionId, updated_at: new Date().toISOString() })
    .eq('id', documentId);

  // 11. Register in memory cache for diff engine
  try {
    const textContent = file.toString('utf-8');
    setVersionContent(versionId, textContent);
  } catch {
    // binary files fallback
  }

  // 12. Audit event
  await logEvent({
    tenantId: doc.tenantId,
    documentId,
    versionId,
    actorId: userId,
    actorType: 'human',
    eventType: 'VERSION_CREATED',
    metadata: {
      versionNumber: nextVersionNumber,
      contentHash,
      versionHash,
      fileSize: file.byteLength,
      message,
    },
  });

  return {
    id: versionRecord.id,
    documentId: versionRecord.document_id,
    parentVersionId: versionRecord.parent_version_id,
    branchId: versionRecord.branch_id,
    versionNumber: versionRecord.version_number,
    contentHash: versionRecord.content_hash,
    versionHash: versionRecord.version_hash,
    storageObjectId: versionRecord.storage_object_id,
    mimeType: versionRecord.mime_type,
    fileSize: Number(versionRecord.file_size),
    createdBy: versionRecord.created_by,
    message: versionRecord.message,
    status: versionRecord.status,
    restoreSourceVersionId: versionRecord.restore_source_version_id,
    createdAt: versionRecord.created_at,
  };
}

export async function listVersions(
  userId: string,
  documentId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResponse<Version>> {
  const doc = await getDocument(userId, documentId);
  if (!doc) {
    throw new NotFoundError('Document not found');
  }

  const supabase = await createServiceClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await supabase
    .from('versions')
    .select('*', { count: 'exact' })
    .eq('document_id', documentId)
    .order('version_number', { ascending: false })
    .range(from, to);

  if (error) {
    throw new AppError(`Failed to list versions: ${error.message}`, 'VERSIONS_LIST_FAILED', 500);
  }

  const items: Version[] = (data || []).map((row) => ({
    id: row.id,
    documentId: row.document_id,
    parentVersionId: row.parent_version_id,
    branchId: row.branch_id,
    versionNumber: row.version_number,
    contentHash: row.content_hash,
    versionHash: row.version_hash,
    storageObjectId: row.storage_object_id,
    mimeType: row.mime_type,
    fileSize: Number(row.file_size),
    createdBy: row.created_by,
    message: row.message,
    status: row.status,
    restoreSourceVersionId: row.restore_source_version_id,
    createdAt: row.created_at,
  }));

  return {
    data: items,
    total: count ?? items.length,
    page,
    pageSize,
  };
}

export async function getVersion(
  userId: string,
  versionId: string,
): Promise<Version | null> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from('versions')
    .select('*')
    .eq('id', versionId)
    .single();

  if (error || !data) {
    throw new NotFoundError('Version not found');
  }

  // Authorize against document access
  const doc = await getDocument(userId, data.document_id);
  if (!doc) {
    throw new NotFoundError('Version not found');
  }

  return {
    id: data.id,
    documentId: data.document_id,
    parentVersionId: data.parent_version_id,
    branchId: data.branch_id,
    versionNumber: data.version_number,
    contentHash: data.content_hash,
    versionHash: data.version_hash,
    storageObjectId: data.storage_object_id,
    mimeType: data.mime_type,
    fileSize: Number(data.file_size),
    createdBy: data.created_by,
    message: data.message,
    status: data.status,
    restoreSourceVersionId: data.restore_source_version_id,
    createdAt: data.created_at,
  };
}

export async function getVersionContent(
  userId: string,
  versionId: string,
): Promise<{ signedUrl: string; expiresAt: string }> {
  const version = await getVersion(userId, versionId);
  if (!version) {
    throw new NotFoundError('Version not found');
  }

  const supabase = await createServiceClient();

  const { data: storageObj } = await supabase
    .from('storage_objects')
    .select('storage_path')
    .eq('version_id', versionId)
    .single();

  if (!storageObj?.storage_path) {
    throw new NotFoundError('Storage object not found for version');
  }

  const signedUrl = await getSignedUrl(storageObj.storage_path, SIGNED_URL_EXPIRY_SECONDS);
  const expiresAt = new Date(Date.now() + SIGNED_URL_EXPIRY_SECONDS * 1000).toISOString();

  return { signedUrl, expiresAt };
}

export async function restoreVersion(
  userId: string,
  versionId: string,
  data: RestoreVersionRequest,
): Promise<Version> {
  const targetVer = await getVersion(userId, versionId);
  if (!targetVer) {
    throw new NotFoundError('Target version to restore not found');
  }

  // Retrieve content from memory store or download from storage
  let contentBuffer: Buffer;
  const inMemContent = getStoredVersionContent(versionId);

  if (inMemContent) {
    contentBuffer = Buffer.from(inMemContent, 'utf-8');
  } else {
    const supabase = await createServiceClient();
    const { data: storageObj } = await supabase
      .from('storage_objects')
      .select('storage_path')
      .eq('version_id', versionId)
      .single();

    if (!storageObj?.storage_path) {
      throw new NotFoundError('Version storage object not found');
    }

    const { data: downloadedBlob, error: downloadError } = await supabase.storage
      .from('documents')
      .download(storageObj.storage_path);

    if (downloadError || !downloadedBlob) {
      throw new AppError(`Failed to download restored version content: ${downloadError?.message}`, 'RESTORE_DOWNLOAD_FAILED', 500);
    }

    const arrayBuffer = await downloadedBlob.arrayBuffer();
    contentBuffer = Buffer.from(arrayBuffer);
  }

  // Create a NEW version restoring from targetVer
  const restoreMessage = data.message ?? `Restored from V${targetVer.versionNumber}`;
  const newVersion = await createVersion(
    userId,
    targetVer.documentId,
    contentBuffer,
    targetVer.mimeType,
    restoreMessage,
    data.branchId ?? targetVer.branchId,
  );

  // Update restore_source_version_id pointer
  const supabase = await createServiceClient();
  await supabase
    .from('versions')
    .update({ restore_source_version_id: versionId })
    .eq('id', newVersion.id);

  newVersion.restoreSourceVersionId = versionId;

  // Audit event
  const doc = await getDocument(userId, targetVer.documentId);
  if (doc) {
    await logEvent({
      tenantId: doc.tenantId,
      documentId: targetVer.documentId,
      versionId: newVersion.id,
      actorId: userId,
      actorType: 'human',
      eventType: 'VERSION_RESTORED',
      metadata: {
        restoredFromVersionId: versionId,
        newVersionNumber: newVersion.versionNumber,
      },
    });
  }

  return newVersion;
}
