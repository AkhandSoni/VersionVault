// ============================================================
// VersionVault — Version Service (Person 1)
// Immutable snapshot management, SHA-256 integrity chaining,
// and private storage integration.
// ============================================================

import { after } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';
import { ConflictError, NotFoundError, AppError } from '@/lib/errors';
import { validateUpload } from '@/lib/validation';
import { sha256, computeVersionHash } from '@/lib/hash';
import { DEFAULT_PAGE_SIZE, SIGNED_URL_EXPIRY_SECONDS } from '@/lib/constants';
import { uploadObject, getSignedUrl, deleteObject } from './storage.service';
import { getDocument } from './document.service';
import { logEvent } from './activity.service';
import { computeDiff, setVersionContent, storeStructuredChanges } from './diff.service';
import { extractDocumentText, finishProcessingJob, startProcessingJob, storeVersionText } from './extraction.service';
import { assertDocumentCanEdit } from './authorization.service';
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
  restoreSourceVersionId?: string | null,
  fileName?: string,
  deferProcessing = false,
): Promise<Version> {
  // 1. Validate file size and MIME type
  validateUpload(file, mimeType, fileName);

  // 2. Compute deterministic SHA-256 contentHash
  const contentHash = sha256(file);

  // 3. Verify document exists and user is authorized
  const { document: doc } = await assertDocumentCanEdit(userId, documentId);

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

  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .select('id, document_id, tenant_id, head_version_id, status')
    .eq('id', targetBranchId)
    .maybeSingle();

  if (branchError) {
    throw new AppError(`Failed to resolve branch: ${branchError.message}`, 'BRANCH_LOOKUP_FAILED', 500);
  }

  if (!branch || branch.document_id !== documentId || branch.tenant_id !== doc.tenantId) {
    throw new NotFoundError('Branch not found');
  }

  if (branch.status !== 'ACTIVE') {
    throw new ConflictError('Cannot create a version on an archived branch');
  }

  // 5. Resolve parent version and version number
  let parentId = parentVersionId ?? null;
  let parentVersionHash: string | null = null;
  let nextVersionNumber = 1;

  if (!parentId) {
    parentId = branch.head_version_id ?? null;
  }

  if (parentId) {
    const { data: parentVer, error: parentError } = await supabase
      .from('versions')
      .select('id, document_id, branch_id, version_number, version_hash, status')
      .eq('id', parentId)
      .maybeSingle();

    if (parentError) {
      throw new AppError(`Failed to resolve parent version: ${parentError.message}`, 'PARENT_VERSION_LOOKUP_FAILED', 500);
    }

    if (!parentVer || parentVer.document_id !== documentId || parentVer.status !== 'READY') {
      throw new NotFoundError('Parent version not found');
    }

    if (branch.head_version_id !== parentVer.id) {
      throw new ConflictError('Branch HEAD changed; retry against the latest version');
    }

    nextVersionNumber = parentVer.version_number + 1;
    parentVersionHash = parentVer.version_hash ?? null;
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
    fileName,
  );

  // 8-10. Atomically persist storage metadata, version, lineage pointers,
  // and the authoritative VERSION_CREATED audit event.
  const { data: versionRecord, error: finalizeError } = await supabase.rpc('finalize_version', {
    p_version_id: versionId,
    p_document_id: documentId,
    p_tenant_id: doc.tenantId,
    p_branch_id: targetBranchId,
    p_parent_version_id: parentId,
    p_expected_head_version_id: branch.head_version_id,
    p_version_number: nextVersionNumber,
    p_content_hash: contentHash,
    p_version_hash: versionHash,
    p_storage_object_id: storageObjectId,
    p_storage_path: storagePath,
    p_mime_type: mimeType,
    p_file_size: file.byteLength,
    p_created_by: userId,
    p_message: message ?? null,
    p_restore_source_version_id: restoreSourceVersionId ?? null,
  });

  if (finalizeError || !versionRecord) {
    try {
      await deleteObject(storagePath);
    } catch {
      // The orphan sweeper introduced in the processing phase will retry cleanup.
    }

    if (finalizeError?.message.includes('VERSION_HEAD_CONFLICT')) {
      throw new ConflictError('Branch HEAD changed; retry against the latest version');
    }

    throw new AppError(`Failed to finalize version: ${finalizeError?.message ?? 'No version returned'}`, 'VERSION_FINALIZE_FAILED', 500);
  }

  // The immutable artifact is already finalized. Derived text and diff state
  // may be deferred until after the response without changing version truth.
  const processing = {
    tenantId: doc.tenantId,
    documentId,
    versionId,
    file,
    mimeType,
    parentVersionId: parentId,
  };
  if (deferProcessing) {
    try {
      after(async () => {
        try {
          await processVersionDerivedData(processing);
        } catch {
          // Derived evidence is retryable and must not affect the committed
          // immutable artifact or the already-sent mutation response.
        }
      });
    } catch {
      // CLI/demo callers do not have a Next request context. Preserve their
      // previous synchronous behavior instead of silently dropping evidence.
      await processVersionDerivedData(processing);
    }
  } else {
    await processVersionDerivedData(processing);
  }

  return mapVersionRecord(versionRecord);
}

/**
 * Populate non-authoritative search/diff evidence for an already-finalized
 * immutable version. This is deliberately independent from finalization so a
 * slow parser or diff cannot delay the commit response or alter the snapshot.
 */
export async function processVersionDerivedData(params: {
  tenantId?: string;
  documentId: string;
  versionId: string;
  file: Buffer;
  mimeType: string;
  parentVersionId: string | null;
}): Promise<void> {
  let tenantId = params.tenantId;
  if (!tenantId) {
    const supabase = await createServiceClient();
    const { data: document } = await supabase
      .from('documents')
      .select('tenant_id')
      .eq('id', params.documentId)
      .maybeSingle();
    tenantId = document?.tenant_id;
  }
  if (!tenantId) return;

  const processingJobId = await startProcessingJob(params.versionId);
  let processingFailure: string | undefined;
  const extracted = await extractDocumentText(params.file, params.mimeType);
  try {
    await storeVersionText({
      tenantId,
      documentId: params.documentId,
      versionId: params.versionId,
      mimeType: params.mimeType,
      extracted,
    });
  } catch (error) {
    processingFailure = error instanceof Error ? error.message : 'Failed to persist extracted text';
  }

  if (extracted.extractionStatus === 'READY') {
    setVersionContent(params.versionId, extracted.text);
  } else {
    processingFailure = extracted.error || extracted.warnings.join(' ') || 'Text extraction did not complete';
  }

  if (params.parentVersionId && extracted.extractionStatus === 'READY') {
    try {
      const changes = await computeDiff(params.parentVersionId, params.versionId);
      await storeStructuredChanges(changes);
    } catch (error) {
      processingFailure = error instanceof Error ? error.message : 'Failed to persist deterministic diff';
    }
  }

  if (processingJobId) {
    await finishProcessingJob(processingJobId, processingFailure ? 'FAILED' : 'COMPLETED', processingFailure);
  }
}

type FinalizedVersionRecord = {
  id: string;
  document_id: string;
  parent_version_id: string | null;
  branch_id: string;
  version_number: number;
  content_hash: string;
  version_hash?: string | null;
  storage_object_id: string;
  mime_type: string;
  file_size: number | string;
  created_by: string;
  message?: string | null;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
  restore_source_version_id?: string | null;
  created_at: string;
};

function mapVersionRecord(versionRecord: FinalizedVersionRecord): Version {
  return {
    id: versionRecord.id,
    documentId: versionRecord.document_id,
    parentVersionId: versionRecord.parent_version_id,
    branchId: versionRecord.branch_id,
    versionNumber: versionRecord.version_number,
    contentHash: versionRecord.content_hash,
    versionHash: versionRecord.version_hash ?? undefined,
    storageObjectId: versionRecord.storage_object_id,
    mimeType: versionRecord.mime_type,
    fileSize: Number(versionRecord.file_size),
    createdBy: versionRecord.created_by,
    message: versionRecord.message ?? undefined,
    status: versionRecord.status,
    restoreSourceVersionId: versionRecord.restore_source_version_id ?? undefined,
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

  return listVersionsForAuthorizedDocument(documentId, page, pageSize);
}

/**
 * Query versions after the caller has already authorized the document.
 * Keeping this separate prevents aggregate workspace reads from repeating
 * the same document/membership lookup for every child collection.
 */
export async function listVersionsForAuthorizedDocument(
  documentId: string,
  page = 1,
  pageSize = DEFAULT_PAGE_SIZE,
): Promise<PaginatedResponse<Version>> {

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

/**
 * Download the exact immutable bytes stored for a version. The client must
 * never reconstruct a document from extracted text or UI metadata.
 */
export async function downloadVersionContent(
  userId: string,
  versionId: string,
): Promise<{ data: Buffer; mimeType: string; fileName: string }> {
  const version = await getVersion(userId, versionId);
  if (!version) throw new NotFoundError('Version not found');

  const document = await getDocument(userId, version.documentId);
  if (!document) throw new NotFoundError('Document not found');

  const supabase = await createServiceClient();
  const { data: storageObject, error: storageError } = await supabase
    .from('storage_objects')
    .select('storage_path, mime_type')
    .eq('version_id', versionId)
    .single();

  if (storageError || !storageObject?.storage_path) {
    throw new NotFoundError('Storage object not found for version');
  }

  const { data: blob, error: downloadError } = await supabase.storage
    .from('documents')
    .download(storageObject.storage_path);

  if (downloadError || !blob) {
    throw new AppError(`Failed to download version content: ${downloadError?.message ?? 'Unknown error'}`, 'DOWNLOAD_FAILED', 500);
  }

  const safeTitle = document.title.replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'document';
  const extension = extensionForMime(version.mimeType) === '.bin'
    ? storageObject.storage_path.match(/(\.[a-z0-9]{1,16})$/i)?.[1]?.toLowerCase() ?? '.bin'
    : extensionForMime(version.mimeType);
  return {
    data: Buffer.from(await blob.arrayBuffer()),
    mimeType: storageObject.mime_type || version.mimeType || 'application/octet-stream',
    fileName: `${safeTitle}-V${version.versionNumber}${extension}`,
  };
}

function extensionForMime(mimeType: string): string {
  const extensions: Record<string, string> = {
    'application/pdf': '.pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
    'application/msword': '.doc',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
    'application/vnd.ms-powerpoint': '.ppt',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
    'application/vnd.ms-excel': '.xls',
    'application/vnd.oasis.opendocument.text': '.odt',
    'application/vnd.oasis.opendocument.presentation': '.odp',
    'application/vnd.oasis.opendocument.spreadsheet': '.ods',
    'application/rtf': '.rtf',
    'text/markdown': '.md',
    'text/csv': '.csv',
    'text/tab-separated-values': '.tsv',
    'application/json': '.json',
    'application/xml': '.xml',
    'text/html': '.html',
    'text/plain': '.txt',
  };
  return extensions[mimeType] ?? '.bin';
}

export async function restoreVersion(
  userId: string,
  versionId: string,
  data: RestoreVersionRequest,
  deferProcessing = false,
): Promise<Version> {
  const targetVer = await getVersion(userId, versionId);
  if (!targetVer) {
    throw new NotFoundError('Target version to restore not found');
  }
  await assertDocumentCanEdit(userId, targetVer.documentId);

  // Restore must copy the original stored object, not extracted text.
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
  const contentBuffer = Buffer.from(arrayBuffer);

  // Create a NEW version restoring from targetVer
  const restoreMessage = data.message ?? `Restored from V${targetVer.versionNumber}`;
  const newVersion = await createVersion(
    userId,
    targetVer.documentId,
    contentBuffer,
    targetVer.mimeType,
    restoreMessage,
    data.branchId ?? targetVer.branchId,
    undefined,
    versionId,
    undefined,
    deferProcessing,
  );

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
