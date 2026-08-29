// ============================================================
// VersionVault — Request Validation Helpers
// Server-side only. See SECURITY.md §13.
// ============================================================

import { UPLOAD_LIMITS, ACCEPTED_MIME_TYPES, type AcceptedMimeType } from './constants';
import { ValidationError, UploadError } from './errors';

/**
 * Validate an uploaded file buffer.
 * Checks size and MIME type (caller must also verify magic bytes
 * per SECURITY.md §13 before storing).
 */
export function validateUpload(
  buffer: Buffer,
  declaredMimeType: string,
): void {
  if (buffer.byteLength > UPLOAD_LIMITS.MAX_UPLOAD_BYTES) {
    throw new UploadError(
      `File exceeds maximum size of ${UPLOAD_LIMITS.MAX_UPLOAD_BYTES / 1024 / 1024} MB`,
    );
  }

  if (!ACCEPTED_MIME_TYPES.includes(declaredMimeType as AcceptedMimeType)) {
    throw new UploadError(
      `Unsupported file type: ${declaredMimeType}. Accepted: ${ACCEPTED_MIME_TYPES.join(', ')}`,
    );
  }
}

/**
 * Validate a UUID string.
 */
export function validateUuid(value: string, fieldName: string): void {
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!UUID_RE.test(value)) {
    throw new ValidationError(`Invalid UUID for field '${fieldName}'`);
  }
}

/**
 * Validate pagination parameters.
 */
export function validatePagination(page: unknown, pageSize: unknown): { page: number; pageSize: number } {
  const p = typeof page === 'number' ? page : parseInt(String(page ?? '1'), 10);
  const ps = typeof pageSize === 'number' ? pageSize : parseInt(String(pageSize ?? '20'), 10);

  if (isNaN(p) || p < 1) throw new ValidationError('page must be >= 1');
  if (isNaN(ps) || ps < 1 || ps > 100) throw new ValidationError('pageSize must be between 1 and 100');

  return { page: p, pageSize: ps };
}

/**
 * Assert a string is non-empty.
 */
export function requireString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`'${fieldName}' is required and must be a non-empty string`);
  }
  return value.trim();
}
