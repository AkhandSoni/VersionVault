// ============================================================
// VersionVault — Diff Service (Person 2)
// ============================================================

// TODO: Implement deterministic diff engine
//   - extract / normalize document content
//   - compute structured changes between two versions
//   - classify materiality (category + severity)
//   - provenance chain

import type { StructuredChange } from '@/types';

export async function computeDiff(
  _baseVersionId: string,
  _targetVersionId: string,
): Promise<StructuredChange[]> {
  throw new Error('diff.computeDiff not implemented');
}

export async function getStructuredChanges(
  _baseVersionId: string,
  _targetVersionId: string,
): Promise<StructuredChange[]> {
  throw new Error('diff.getStructuredChanges not implemented');
}
