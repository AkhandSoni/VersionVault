// ============================================================
// VersionVault — Storage Service (Person 1)
// Uses Supabase Storage — private bucket only.
// ============================================================

import { createServiceClient } from '@/lib/supabase/server';
import { StorageError, ValidationError } from '@/lib/errors';
import { STORAGE_BUCKET, SIGNED_URL_EXPIRY_SECONDS } from '@/lib/constants';

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
): Promise<{ path: string }> {
  // Validate path components against path traversal
  if (
    tenantId.includes('..') ||
    documentId.includes('..') ||
    versionId.includes('..') ||
    objectId.includes('..')
  ) {
    throw new ValidationError('Invalid path component for storage upload');
  }

  const storagePath = `${tenantId}/${documentId}/${versionId}/${objectId}`;
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
 * Download text content of an object from private storage.
 */
export async function downloadObjectContent(path: string): Promise<string> {
  try {
    const supabase = await createServiceClient();
    const { data, error } = await supabase.storage.from(STORAGE_BUCKET).download(path);
    if (error || !data) {
      return '';
    }
    const buffer = await data.arrayBuffer();
    return Buffer.from(buffer).toString('utf-8');
  } catch {
    return '';
  }
}

