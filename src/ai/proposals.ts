import { AIProposal, Version, ActivityEvent } from "../types/contracts.js";
import { normalizeDocument } from "../engine/normalization.js";

export class ProposalManager {
  private proposals: Map<string, AIProposal> = new Map();
  private auditLogs: ActivityEvent[] = [];

  /**
   * Creates a new AI Proposal in PENDING state.
   */
  createProposal(
    documentId: string,
    branchId: string,
    sourceVersionId: string,
    proposedContent: string,
    rationale: string,
    model = "meta-llama/llama-3.1-70b-instruct",
    taskId = "task_ai_edit"
  ): AIProposal {
    const proposalId = "prop_" + Math.random().toString(36).substring(2, 11);
    const proposal: AIProposal = {
      id: proposalId,
      documentId,
      branchId,
      sourceVersionId,
      proposedContent,
      rationale,
      actorType: "ai_agent",
      actorId: `ai_agent_${model.replace(/[^a-zA-Z0-9]/g, "_")}`,
      model,
      taskId,
      status: "PENDING",
      createdAt: new Date().toISOString(),
    };

    this.proposals.set(proposalId, proposal);

    // Record audit event for AI Proposal Creation
    this.auditLogs.push({
      id: "evt_" + Math.random().toString(36).substring(2, 11),
      tenantId: "tenant_default",
      documentId,
      versionId: sourceVersionId,
      actorId: proposal.actorId ?? "ai_agent",
      actorType: "ai_agent",
      eventType: "AI_PROPOSAL_CREATED",
      timestamp: proposal.createdAt,
      metadata: { proposalId, rationale },
    });

    return proposal;
  }

  /**
   * Retrieves proposal by ID
   */
  getProposal(proposalId: string): AIProposal | undefined {
    return this.proposals.get(proposalId);
  }

  /**
   * Approves an AI proposal after verifying staleness.
   * Creates a new immutable Version via Person 1 contract.
   */
  approveProposal(
    proposalId: string,
    approverUserId: string,
    currentBranchHeadVersion: Version,
    versionCreationFn: (params: {
      documentId: string;
      parentVersionId: string;
      branchId: string;
      content: string;
      createdBy: string;
      message: string;
      restoreSourceVersionId?: string | null;
    }) => Version
  ): { success: boolean; newVersion?: Version; error?: string } {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return { success: false, error: "Proposal not found" };
    }

    if (proposal.status !== "PENDING") {
      return { success: false, error: `Proposal is already ${proposal.status}` };
    }

    // Staleness Check: Source version must equal current branch head version
    if (proposal.sourceVersionId !== currentBranchHeadVersion.id) {
      return {
        success: false,
        error: `STALE_PROPOSAL: Branch HEAD has advanced from ${proposal.sourceVersionId} to ${currentBranchHeadVersion.id}. Please regenerate proposal against latest HEAD.`,
      };
    }

    // Mark proposal approved
    const approvedAt = new Date().toISOString();
    proposal.status = "APPROVED";
    proposal.approvedBy = approverUserId;
    proposal.approvedAt = approvedAt;

    // Create resulting authoritative version
    const newVersion = versionCreationFn({
      documentId: proposal.documentId,
      parentVersionId: currentBranchHeadVersion.id,
      branchId: proposal.branchId,
      content: proposal.proposedContent,
      createdBy: proposal.actorId ?? "ai_agent", // AI Agent created content
      message: `AI Proposal Approved by ${approverUserId}: ${proposal.rationale}`,
    });

    proposal.resultingVersionId = newVersion.id;

    // Log approval audit event
    this.auditLogs.push({
      id: "evt_" + Math.random().toString(36).substring(2, 11),
      tenantId: "tenant_default",
      documentId: proposal.documentId,
      versionId: newVersion.id,
      actorId: approverUserId,
      actorType: "user",
      eventType: "AI_PROPOSAL_APPROVED",
      timestamp: approvedAt,
      metadata: { proposalId, resultingVersionId: newVersion.id, aiAgentId: proposal.actorId },
    });

    return { success: true, newVersion };
  }

  /**
   * Rejects an AI proposal
   */
  rejectProposal(proposalId: string, rejecterUserId: string): { success: boolean; error?: string } {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return { success: false, error: "Proposal not found" };
    }

    if (proposal.status !== "PENDING") {
      return { success: false, error: `Proposal is already ${proposal.status}` };
    }

    const rejectedAt = new Date().toISOString();
    proposal.status = "REJECTED";
    proposal.rejectedBy = rejecterUserId;
    proposal.rejectedAt = rejectedAt;

    this.auditLogs.push({
      id: "evt_" + Math.random().toString(36).substring(2, 11),
      tenantId: "tenant_default",
      documentId: proposal.documentId,
      actorId: rejecterUserId,
      actorType: "user",
      eventType: "AI_PROPOSAL_REJECTED",
      timestamp: rejectedAt,
      metadata: { proposalId },
    });

    return { success: true };
  }

  getAuditLogs(): ActivityEvent[] {
    return [...this.auditLogs];
  }
}
