import {
  ProvenanceRecord,
  StructuredChange,
  Version,
  LineBlame,
  SectionBlame,
} from "../types/contracts";
import { normalizeDocument, computeSHA256 } from "./normalization";

/**
 * Builds cryptographic provenance record for a material change.
 */
export function buildProvenanceRecord(
  change: StructuredChange,
  targetVersion: Version,
  documentId: string,
  rawContent: string
): ProvenanceRecord {
  const verifiedHash = computeSHA256(rawContent);
  const verifiedIntegrity = targetVersion.contentHash.toLowerCase() === verifiedHash.toLowerCase();

  return {
    changeId: change.id,
    targetVersionId: targetVersion.id,
    documentId,
    actorId: targetVersion.createdBy,
    actorType: targetVersion.createdBy.startsWith("ai_") ? "ai_agent" : "user",
    branchId: targetVersion.branchId,
    timestamp: targetVersion.createdAt,
    storageObjectId: targetVersion.storageObjectId,
    contentHash: targetVersion.contentHash,
    verifiedIntegrity,
  };
}

/**
 * Computes line-by-line blame across a list of chronological versions for a document.
 */
export function computeDocumentBlame(
  versions: Version[],
  versionContents: Map<string, string>
): LineBlame[] {
  // Sort versions by versionNumber ascending
  const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);

  if (sortedVersions.length === 0) return [];

  const latestVersion = sortedVersions[sortedVersions.length - 1];
  const latestContent = versionContents.get(latestVersion.id) || "";
  const latestNorm = normalizeDocument(latestContent);

  const blameList: LineBlame[] = latestNorm.lines.map((lineText, idx) => ({
    lineNumber: idx + 1,
    content: lineText,
    versionId: latestVersion.id,
    versionNumber: latestVersion.versionNumber,
    authorId: latestVersion.createdBy,
    authorType: latestVersion.createdBy.startsWith("ai_") ? "ai_agent" : "user",
    timestamp: latestVersion.createdAt,
    commitMessage: latestVersion.message,
  }));

  // Iterate backwards through version history to find original version that introduced each line
  for (let i = sortedVersions.length - 1; i >= 0; i--) {
    const v = sortedVersions[i];
    const vContent = versionContents.get(v.id);
    if (!vContent) continue;
    const vNorm = normalizeDocument(vContent);

    for (const blameItem of blameList) {
      if (vNorm.lines.includes(blameItem.content)) {
        blameItem.versionId = v.id;
        blameItem.versionNumber = v.versionNumber;
        blameItem.authorId = v.createdBy;
        blameItem.authorType = v.createdBy.startsWith("ai_") ? "ai_agent" : "user";
        blameItem.timestamp = v.createdAt;
        blameItem.commitMessage = v.message;
      }
    }
  }

  return blameList;
}

/**
 * Computes section-level blame and change history across versions.
 */
export function computeSectionBlame(
  sectionTitle: string,
  versions: Version[],
  versionContents: Map<string, string>
): SectionBlame {
  const sortedVersions = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
  const changeHistory: SectionBlame["changeHistory"] = [];

  let lastVersionId = "";
  let lastAuthor = "";
  let lastAt = "";

  for (let i = 0; i < sortedVersions.length; i++) {
    const v = sortedVersions[i];
    const content = versionContents.get(v.id) || "";
    const norm = normalizeDocument(content);
    const sec = norm.sections.find((s) => s.title.toLowerCase() === sectionTitle.toLowerCase());

    if (sec) {
      lastVersionId = v.id;
      lastAuthor = v.createdBy;
      lastAt = v.createdAt;

      const changeType = i === 0 ? "ADDED" : "MODIFIED";
      changeHistory.push({
        versionId: v.id,
        versionNumber: v.versionNumber,
        authorId: v.createdBy,
        changeType,
        summary: v.message || `Section ${sectionTitle} updated in v${v.versionNumber}`,
      });
    }
  }

  return {
    sectionTitle,
    lastModifiedVersionId: lastVersionId,
    lastModifiedBy: lastAuthor,
    lastModifiedAt: lastAt,
    changeHistory,
  };
}
