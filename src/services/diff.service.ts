// ============================================================
// VersionVault — Diff Service (Person 2)
// ============================================================

import type { StructuredChange } from '../types/contracts';
import { computeStructuredDiff } from '../engine/diff';
import { getVersionTextContent } from './extraction.service';
import { createServiceClient } from '@/lib/supabase/server';

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
  const baseContent =
    baseContentOverride ??
    (await getVersionTextContent(baseVersionId)) ??
    versionContentStore.get(baseVersionId);
  const targetContent =
    targetContentOverride ??
    (await getVersionTextContent(targetVersionId)) ??
    versionContentStore.get(targetVersionId);

  if (baseContent === undefined || targetContent === undefined) {
    return [];
  }

  const result = computeStructuredDiff(
    baseContent,
    targetContent,
    baseVersionId,
    targetVersionId
  );

  return result.changes as StructuredChange[];
}

/**
 * Persist computed changes so API consumers can review stable evidence.
 */
export async function storeStructuredChanges(changes: StructuredChange[]): Promise<void> {
  if (changes.length === 0) return;

  const supabase = await createServiceClient();
  const { error } = await supabase.from('structured_changes').upsert(
    changes.map((change) => ({
      id: change.id,
      base_version_id: change.baseVersionId,
      target_version_id: change.targetVersionId,
      type: change.type,
      section: change.section ?? null,
      old_value: change.oldValue ?? null,
      new_value: change.newValue ?? null,
      category: change.category ?? null,
      severity: change.severity ?? null,
      confidence: change.confidence ?? null,
      location: change.location ?? null,
    })),
  );

  if (error) {
    throw new Error(`Failed to store structured changes: ${error.message}`);
  }
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
