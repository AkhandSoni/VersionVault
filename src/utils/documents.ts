import { format, formatDistanceToNow } from 'date-fns';
import { aiExplanations, documents } from '../data/documents';
import type { AIExplanation, DocumentRecord, StructuredChange, Version } from '../types';

export function getDocument(id: string | undefined): DocumentRecord | undefined {
  return documents.find((doc) => doc.id === id);
}

export function getVersion(
doc: DocumentRecord | undefined,
versionId: string | undefined)
: Version | undefined {
  return doc?.versions.find((version) => version.id === versionId);
}

export function getParent(
doc: DocumentRecord | undefined,
version: Version | undefined)
: Version | undefined {
  if (!doc || !version?.parentId) return undefined;
  return getVersion(doc, version.parentId);
}

export function versionsOnBranch(doc: DocumentRecord, branch: string): Version[] {
  return doc.versions.
  filter((version) => version.branch === branch).
  sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

export function explanationFor(change: StructuredChange | undefined): AIExplanation | undefined {
  if (!change) return undefined;
  return aiExplanations.find((item) => item.changeId === change.id);
}

export function materialChanges(): Array<{doc: DocumentRecord;version: Version;change: StructuredChange;}> {
  const rows: Array<{doc: DocumentRecord;version: Version;change: StructuredChange;}> = [];
  documents.forEach((doc) => {
    doc.versions.forEach((version) => {
      version.changes.
      filter((change) => change.material).
      forEach((change) => rows.push({ doc, version, change }));
    });
  });
  return rows.sort((a, b) => b.version.timestamp.localeCompare(a.version.timestamp));
}

export function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}…${hash.slice(-6)}`;
}

export function absoluteTime(timestamp: string): string {
  return format(new Date(timestamp), "d MMM yyyy 'at' HH:mm");
}

export function relativeTime(timestamp: string): string {
  return `${formatDistanceToNow(new Date(timestamp))} ago`;
}