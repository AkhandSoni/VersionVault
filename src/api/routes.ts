import { Router, Request, Response } from "express";
import { computeStructuredDiff } from "../engine/diff.js";
import { computeDocumentBlame, buildProvenanceRecord } from "../engine/provenance.js";
import { explainStructuredChanges } from "../ai/explainer.js";
import { answerHistoryQuestion } from "../ai/historyQa.js";
import { OpenRouterGateway } from "../ai/gateway.js";
import { ProposalManager } from "../ai/proposals.js";
import { Version } from "../types/contracts.js";

export function createRouter(
  versionStore: Map<string, { version: Version; content: string }>,
  proposalManager: ProposalManager,
  gateway: OpenRouterGateway
): Router {
  const router = Router();

  // Health checks
  router.get("/health/live", (req: Request, res: Response) => {
    res.json({ status: "alive" });
  });

  router.get("/health/ready", (req: Request, res: Response) => {
    res.json({ status: "ready" });
  });

  // GET /api/v1/versions/:baseVersionId/diff/:targetVersionId
  router.get("/api/v1/versions/:baseVersionId/diff/:targetVersionId", (req: Request, res: Response) => {
    const baseVersionId = req.params.baseVersionId as string;
    const targetVersionId = req.params.targetVersionId as string;

    const baseEntry = versionStore.get(baseVersionId);
    const targetEntry = versionStore.get(targetVersionId);

    if (!baseEntry || !targetEntry) {
      res.status(404).json({ error: { code: "VERSION_NOT_FOUND", message: "Version not found" } });
      return;
    }

    const diffResult = computeStructuredDiff(
      baseEntry.content,
      targetEntry.content,
      baseVersionId,
      targetVersionId
    );

    res.json(diffResult);
  });

  // GET /api/v1/documents/:documentId/blame
  router.get("/api/v1/documents/:documentId/blame", (req: Request, res: Response) => {
    const documentId = req.params.documentId as string;

    const docVersions: Version[] = [];
    const contentsMap = new Map<string, string>();

    for (const [vId, entry] of versionStore.entries()) {
      if (entry.version.documentId === documentId) {
        docVersions.push(entry.version);
        contentsMap.set(vId, entry.content);
      }
    }

    if (docVersions.length === 0) {
      res.status(404).json({ error: { code: "DOCUMENT_NOT_FOUND", message: "Document not found" } });
      return;
    }

    const blame = computeDocumentBlame(docVersions, contentsMap);
    res.json({ documentId, blame });
  });

  // POST /api/v1/ai/explain-diff
  router.post("/api/v1/ai/explain-diff", async (req: Request, res: Response) => {
    const { baseVersionId, targetVersionId } = req.body;

    const baseEntry = versionStore.get(baseVersionId);
    const targetEntry = versionStore.get(targetVersionId);

    if (!baseEntry || !targetEntry) {
      res.status(404).json({ error: { code: "VERSION_NOT_FOUND", message: "Version not found" } });
      return;
    }

    const diffResult = computeStructuredDiff(
      baseEntry.content,
      targetEntry.content,
      baseVersionId,
      targetVersionId
    );

    const explanation = await explainStructuredChanges(diffResult.changes, gateway);
    res.json({ diffResult, explanation });
  });

  // POST /api/v1/ai/propose-change
  router.post("/api/v1/ai/propose-change", (req: Request, res: Response) => {
    const { documentId, branchId, sourceVersionId, proposedContent, rationale } = req.body;

    if (!documentId || !sourceVersionId || !proposedContent) {
      res.status(400).json({ error: { code: "BAD_REQUEST", message: "Missing required fields" } });
      return;
    }

    const proposal = proposalManager.createProposal(
      documentId,
      branchId || "main",
      sourceVersionId,
      proposedContent,
      rationale || "AI proposed document update"
    );

    res.status(201).json(proposal);
  });

  // POST /api/v1/ai/proposals/:proposalId/approve
  router.post("/api/v1/ai/proposals/:proposalId/approve", (req: Request, res: Response) => {
    const proposalId = req.params.proposalId as string;
    const { approverUserId, currentHeadVersionId } = req.body;

    const currentHead = versionStore.get(currentHeadVersionId)?.version;
    if (!currentHead) {
      res.status(400).json({ error: { code: "HEAD_NOT_FOUND", message: "Branch HEAD version not found" } });
      return;
    }

    const result = proposalManager.approveProposal(
      proposalId,
      approverUserId || "user_human",
      currentHead,
      ({ documentId, parentVersionId, branchId, content, createdBy, message }) => {
        // Version creation stub implementation
        const vNumber = currentHead.versionNumber + 1;
        const vId = `v_${documentId}_${vNumber}`;
        const crypto = require("crypto");
        const hash = crypto.createHash("sha256").update(content).digest("hex");
        const newVer: Version = {
          id: vId,
          documentId,
          parentVersionId,
          branchId,
          versionNumber: vNumber,
          contentHash: hash,
          storageObjectId: `obj_${vId}`,
          mimeType: "text/plain",
          fileSize: Buffer.byteLength(content),
          createdBy,
          message,
          status: "READY",
          createdAt: new Date().toISOString(),
        };
        versionStore.set(vId, { version: newVer, content });
        return newVer;
      }
    );

    if (!result.success) {
      res.status(409).json({ error: { code: "APPROVAL_FAILED", message: result.error } });
      return;
    }

    res.json({ success: true, newVersion: result.newVersion });
  });

  // POST /api/v1/ai/ask-history
  router.post("/api/v1/ai/ask-history", async (req: Request, res: Response) => {
    const { documentId, question } = req.body;

    const docVersions: Version[] = [];
    const allChanges: any[] = [];

    for (const [vId, entry] of versionStore.entries()) {
      if (entry.version.documentId === documentId) {
        docVersions.push(entry.version);
      }
    }

    const qaResult = await answerHistoryQuestion(
      question || "What changed?",
      docVersions,
      allChanges,
      [],
      gateway
    );

    res.json(qaResult);
  });

  return router;
}
