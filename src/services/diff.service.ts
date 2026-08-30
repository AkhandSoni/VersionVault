// ============================================================
// VersionVault — Diff Service (Person 2)
// ============================================================

import type { StructuredChange } from '../types/contracts.js';
import { computeStructuredDiff } from '../engine/diff.js';
import { createServiceClient } from '@/lib/supabase/server';
import { downloadObjectContent } from './storage.service';

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
 * Retrieves text content for a version (first checks memory cache, then Supabase DB & Storage)
 */
export async function resolveVersionText(versionId: string): Promise<string> {
  const cached = versionContentStore.get(versionId);
  if (cached !== undefined) {
    return cached;
  }

  try {
    const supabase = await createServiceClient();
    const { data: storageObj } = await supabase
      .from('storage_objects')
      .select('storage_path')
      .eq('version_id', versionId)
      .single();

    if (storageObj?.storage_path) {
      const text = await downloadObjectContent(storageObj.storage_path);
      if (text) {
        setVersionContent(versionId, text);
        return text;
      }
    }
  } catch {
    // Fallback if Supabase credentials are not configured or DB is unreachable
  }

  return '';
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
  const baseContent = baseContentOverride ?? (await resolveVersionText(baseVersionId));
  const targetContent = targetContentOverride ?? (await resolveVersionText(targetVersionId));

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
