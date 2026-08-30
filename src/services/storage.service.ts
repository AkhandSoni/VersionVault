// ============================================================
// VersionVault — Storage Service (Person 1)
// Uses Supabase Storage — private bucket only.
// ============================================================

import { createServiceClient } from '@/lib/supabase/server';
import { StorageError, ValidationError } from '@/lib/errors';
import { STORAGE_BUCKET, SIGNED_URL_EXPIRY_SECONDS } from '@/lib/constants';
import { validateUuid } from '@/lib/validation';

/**
 * Upload an object to the private Supabase Storage bucket.
 * Path convention: {tenantId}/{documentId}/{versionId}/{objectId}
 */
export async function uploadObject(
  tenantId: string,
  documentId: string,
  versionId: string,
  objectId: string,
  data: Buffer,
  mimeType: string,
  fileName?: string,
): Promise<{ path: string }> {
  for (const [value, field] of [
    [tenantId, 'tenantId'],
    [documentId, 'documentId'],
    [versionId, 'versionId'],
    [objectId, 'objectId'],
  ] as const) {
    try {
      validateUuid(value, field);
    } catch {
      throw new ValidationError('Invalid path component for storage upload');
    }
  }

  // Keep the extension in the private object path so unknown/custom formats
  // can be downloaded with their original type even when their MIME is
  // reported as application/octet-stream.
  const originalExtension = fileName?.match(/(\.[a-z0-9]{1,16})$/i)?.[1].toLowerCase() ?? '';
  const storagePath = `${tenantId}/${documentId}/${versionId}/${objectId}${originalExtension}`;
  const supabase = await createServiceClient();

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(storagePath, data, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw new StorageError(`Failed to upload file to storage: ${error.message}`);
  }

  return { path: storagePath };
}

/**
 * Generate a short-lived signed URL for an object in private storage.
 */
export async function getSignedUrl(
  path: string,
  expiresInSeconds: number = SIGNED_URL_EXPIRY_SECONDS,
): Promise<string> {
  const supabase = await createServiceClient();

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(path, expiresInSeconds);

  if (error || !data?.signedUrl) {
    throw new StorageError(`Failed to generate signed URL: ${error?.message ?? 'Unknown error'}`);
  }

  return data.signedUrl;
}

/**
 * Delete an object from private storage.
 */
export async function deleteObject(path: string): Promise<void> {
  const supabase = await createServiceClient();

  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);

  if (error) {
    throw new StorageError(`Failed to delete object from storage: ${error.message}`);
  }
}

/**
 * Delete multiple objects from private storage.
 */
export async function deleteObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return;

  const supabase = await createServiceClient();
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove(paths);

  if (error) {
    throw new StorageError(`Failed to delete files from storage: ${error.message}`);
  }
}
