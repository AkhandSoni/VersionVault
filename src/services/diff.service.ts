// ============================================================
// VersionVault — Diff Service (Person 2)
// ============================================================

import type { StructuredChange } from '@/types';
import { computeStructuredDiff } from '../engine/diff.js';

// In-memory version content store fallback (for demo/standalone test usage)
const versionContentStore = new Map<string, string>();

/**
 * Register or update version content in the service store
 */
export function setVersionContent(versionId: string, content: string): void {
  versionContentStore.set(versionId, content);
}

/**
 * Get stored content for a version
 */
export function getStoredVersionContent(versionId: string): string | undefined {
  return versionContentStore.get(versionId);
}

/**
 * Computes deterministic structured changes between two document versions.
 */
export async function computeDiff(
  baseVersionId: string,
  targetVersionId: string,
  baseContentOverride?: string,
  targetContentOverride?: string
): Promise<StructuredChange[]> {
  const baseContent = baseContentOverride ?? versionContentStore.get(baseVersionId) ?? '';
  const targetContent = targetContentOverride ?? versionContentStore.get(targetVersionId) ?? '';

  const result = computeStructuredDiff(
    baseContent,
    targetContent,
    baseVersionId,
    targetVersionId
  );

  return result.changes as StructuredChange[];
}

/**
 * Retrieves structured changes between two versions.
 */
export async function getStructuredChanges(
  baseVersionId: string,
  targetVersionId: string,
  baseContentOverride?: string,
  targetContentOverride?: string
): Promise<StructuredChange[]> {
  return computeDiff(baseVersionId, targetVersionId, baseContentOverride, targetContentOverride);
}
