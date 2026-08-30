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

  it("should compute line-by-line blame across multiple versions accurately", () => {
    const v1: Version = {
      id: "v1",
      documentId: "doc1",
      parentVersionId: null,
      branchId: "main",
      versionNumber: 1,
      contentHash: "hash1",
      storageObjectId: "obj1",
      mimeType: "text/plain",
      fileSize: 50,
      createdBy: "user_legal_lead",
      status: "READY",
      createdAt: "2026-08-01T10:00:00.000Z",
    };

    const v2: Version = {
      id: "v2",
      documentId: "doc1",
      parentVersionId: "v1",
      branchId: "main",
      versionNumber: 2,
      contentHash: "hash2",
      storageObjectId: "obj2",
      mimeType: "text/plain",
      fileSize: 60,
      createdBy: "user_vendor_manager",
      status: "READY",
      createdAt: "2026-08-02T10:00:00.000Z",
    };

    const versionContents = new Map<string, string>([
      ["v1", "Payment Terms: 30 days\nSupport: Business hours"],
      ["v2", "Payment Terms: 15 days\nSupport: Business hours"],
    ]);

    const blame = computeDocumentBlame([v1, v2], versionContents);

    expect(blame.length).toBe(2);
    // Line 1 changed in v2 by user_vendor_manager
    expect(blame[0].content).toBe("Payment Terms: 15 days");
    expect(blame[0].versionId).toBe("v2");
    expect(blame[0].authorId).toBe("user_vendor_manager");

    // Line 2 originated in v1 by user_legal_lead
    expect(blame[1].content).toBe("Support: Business hours");
    expect(blame[1].versionId).toBe("v1");
    expect(blame[1].authorId).toBe("user_legal_lead");
  });
});

