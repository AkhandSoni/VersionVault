// ============================================================
// VersionVault — SHA-256 Hashing Utilities
// Deterministic content hashing for version integrity.
// See SECURITY.md §24 for the integrity contract.
// ============================================================

import { createHash } from 'crypto';

/**
 * Compute a deterministic SHA-256 hex digest of a Buffer.
 * Used for contentHash on every Version.
 */
export function sha256(data: Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Compute a deterministic SHA-256 hex digest of a string.
 * The string is encoded as UTF-8 before hashing.
 */
export function sha256String(data: string): string {
  return createHash('sha256').update(data, 'utf8').digest('hex');
}

/**
 * Compute a canonical versionHash that chains:
 *   contentHash + parentVersionHash (or "" for root)
 *
 * This provides a tamper-evident chain anchored at each version.
 * See SECURITY.md §24.
 */
export function computeVersionHash(
  contentHash: string,
  parentVersionHash: string | null,
): string {
  const canonical = JSON.stringify({
    contentHash,
    parentVersionHash: parentVersionHash ?? '',
  });
  return sha256String(canonical);
}
