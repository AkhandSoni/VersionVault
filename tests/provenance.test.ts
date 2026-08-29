import { describe, it, expect } from "vitest";
import { buildProvenanceRecord, computeDocumentBlame } from "../src/engine/provenance.js";
import { Version, StructuredChange } from "../src/types/contracts.js";
import { normalizeDocument } from "../src/engine/normalization.js";

describe("Provenance & Blame Engine", () => {
  it("should verify cryptographic integrity of target version", () => {
    const rawContent = "Payment Terms: 15 days";
    const norm = normalizeDocument(rawContent);

    const version: Version = {
      id: "v2",
      documentId: "doc1",
      parentVersionId: "v1",
      branchId: "main",
      versionNumber: 2,
      contentHash: norm.contentHash,
      storageObjectId: "obj2",
      mimeType: "text/plain",
      fileSize: 100,
      createdBy: "user1",
      status: "READY",
      createdAt: new Date().toISOString(),
    };

    const change: StructuredChange = {
      id: "chg1",
      baseVersionId: "v1",
      targetVersionId: "v2",
      type: "MODIFIED",
      section: "Payment Terms",
      oldValue: "30 days",
      newValue: "15 days",
    };

    const record = buildProvenanceRecord(change, version, "doc1", rawContent);
    expect(record.verifiedIntegrity).toBe(true);
    expect(record.contentHash).toBe(norm.contentHash);
  });

  it("should fail integrity check if raw content hash does not match version hash", () => {
    const version: Version = {
      id: "v2",
      documentId: "doc1",
      parentVersionId: "v1",
      branchId: "main",
      versionNumber: 2,
      contentHash: "tampered_hash_12345",
      storageObjectId: "obj2",
      mimeType: "text/plain",
      fileSize: 100,
      createdBy: "user1",
      status: "READY",
      createdAt: new Date().toISOString(),
    };

    const change: StructuredChange = {
      id: "chg1",
      baseVersionId: "v1",
      targetVersionId: "v2",
      type: "MODIFIED",
    };

    const record = buildProvenanceRecord(change, version, "doc1", "Actual content");
    expect(record.verifiedIntegrity).toBe(false);
  });
});
