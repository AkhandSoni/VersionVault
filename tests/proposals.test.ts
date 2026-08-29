import { describe, it, expect } from "vitest";
import { ProposalManager } from "../src/ai/proposals.js";
import { Version } from "../src/types/contracts.js";

describe("AI Proposals & Human Approval Workflow", () => {
  it("should create proposal in PENDING status", () => {
    const pm = new ProposalManager();
    const prop = pm.createProposal("doc1", "main", "v1", "New content", "Rationale text");

    expect(prop.status).toBe("PENDING");
    expect(prop.actorType).toBe("ai_agent");
  });

  it("should detect stale proposal when branch HEAD has advanced", () => {
    const pm = new ProposalManager();
    const prop = pm.createProposal("doc1", "main", "v1", "New content", "Rationale text");

    const headV2: Version = {
      id: "v2",
      documentId: "doc1",
      parentVersionId: "v1",
      branchId: "main",
      versionNumber: 2,
      contentHash: "hash_v2",
      storageObjectId: "obj_v2",
      mimeType: "text/plain",
      fileSize: 50,
      createdBy: "user2",
      status: "READY",
      createdAt: new Date().toISOString(),
    };

    // Attempting to approve against V2 when proposal source was V1
    const res = pm.approveProposal(prop.id, "approver_user", headV2, () => headV2);

    expect(res.success).toBe(false);
    expect(res.error).toContain("STALE_PROPOSAL");
  });

  it("should successfully approve valid proposal and produce new version with dual attribution", () => {
    const pm = new ProposalManager();
    const prop = pm.createProposal("doc1", "main", "v1", "Proposed v2 text", "Approved edit");

    const headV1: Version = {
      id: "v1",
      documentId: "doc1",
      parentVersionId: null,
      branchId: "main",
      versionNumber: 1,
      contentHash: "hash_v1",
      storageObjectId: "obj_v1",
      mimeType: "text/plain",
      fileSize: 50,
      createdBy: "user1",
      status: "READY",
      createdAt: new Date().toISOString(),
    };

    const res = pm.approveProposal(
      prop.id,
      "user_manager",
      headV1,
      ({ documentId, parentVersionId, content, createdBy, message }) => {
        return {
          id: "v2",
          documentId,
          parentVersionId,
          branchId: "main",
          versionNumber: 2,
          contentHash: "hash_v2",
          storageObjectId: "obj_v2",
          mimeType: "text/plain",
          fileSize: Buffer.byteLength(content),
          createdBy, // AI agent actor ID
          message,
          status: "READY",
          createdAt: new Date().toISOString(),
        };
      }
    );

    expect(res.success).toBe(true);
    expect(res.newVersion).toBeDefined();
    expect(res.newVersion?.versionNumber).toBe(2);

    const updatedProp = pm.getProposal(prop.id);
    expect(updatedProp?.status).toBe("APPROVED");
    expect(updatedProp?.approvedBy).toBe("user_manager");
  });
});
