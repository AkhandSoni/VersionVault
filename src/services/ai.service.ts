// ============================================================
// VersionVault — AI Service (Person 2)
// Server-only — uses OpenRouter with graceful fallback.
// ============================================================

import type { AIExplanation, AIProposal } from '@/types';
import { OpenRouterGateway } from '../ai/gateway.js';
import { explainStructuredChanges } from '../ai/explainer.js';
import { ProposalManager } from '../ai/proposals.js';
import { answerHistoryQuestion as answerHistoryQuestionEngine } from '../ai/historyQa.js';
import { computeDiff } from './diff.service.js';

// Shared service singletons
const gateway = new OpenRouterGateway();
const proposalManager = new ProposalManager();

export function getAIServiceGateway(): OpenRouterGateway {
  return gateway;
}

export function getProposalManager(): ProposalManager {
  return proposalManager;
}

/**
 * Generates grounded explanation from StructuredChange[] between two versions.
 */
export async function getExplanation(
  baseVersionId: string,
  targetVersionId: string,
  baseContentOverride?: string,
  targetContentOverride?: string
): Promise<AIExplanation> {
  const changes = await computeDiff(
    baseVersionId,
    targetVersionId,
    baseContentOverride,
    targetContentOverride
  );

  const result = await explainStructuredChanges(changes, gateway);

  return {
    id: `expl_${baseVersionId}_${targetVersionId}`,
    baseVersionId,
    targetVersionId,
    explanation:
      result.explanation?.summary ??
      result.message ??
      'AI explanation unavailable. Verified deterministic changes remain available.',
    affectedAreas: result.explanation?.referencedChangeIds ?? [],
    status: result.status,
    model: gateway.getModel(),
    createdAt: new Date().toISOString(),
  };
}

/**
 * Creates an AI proposed edit for human review.
 */
export async function createProposal(
  documentId: string,
  sourceVersionId: string,
  taskDescription: string,
  agentId: string,
  proposedContent = ''
): Promise<AIProposal> {
  const proposal = proposalManager.createProposal(
    documentId,
    'main',
    sourceVersionId,
    proposedContent,
    taskDescription,
    agentId
  );

  return {
    id: proposal.id,
    documentId: proposal.documentId,
    sourceVersionId: proposal.sourceVersionId,
    agentId: proposal.actorId,
    taskDescription: proposal.rationale,
    proposedContent: proposal.proposedContent,
    approvalStatus: proposal.status,
    approvedBy: proposal.approvedBy,
    approvedAt: proposal.approvedAt,
    resultingVersionId: proposal.resultingVersionId,
    createdAt: proposal.createdAt,
  };
}

/**
 * Approves an AI proposal, checking for staleness.
 */
export async function approveProposal(
  proposalId: string,
  approvedBy: string,
  currentHeadVersionId?: string
): Promise<AIProposal> {
  const proposal = proposalManager.getProposal(proposalId);
  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  // Create authoritative version stub if not provided
  const headVer = {
    id: currentHeadVersionId ?? proposal.sourceVersionId,
    documentId: proposal.documentId,
    parentVersionId: null,
    branchId: proposal.branchId,
    versionNumber: 2,
    contentHash: 'hash_approved_proposal',
    storageObjectId: `obj_${proposalId}`,
    mimeType: 'text/plain',
    fileSize: proposal.proposedContent.length,
    createdBy: proposal.actorId,
    status: 'READY' as const,
    createdAt: new Date().toISOString(),
  };

  const result = proposalManager.approveProposal(
    proposalId,
    approvedBy,
    headVer,
    (params) => ({
      ...headVer,
      id: `ver_${proposal.documentId}_${Date.now()}`,
      parentVersionId: params.parentVersionId,
      createdBy: params.createdBy,
      message: params.message,
    })
  );

  if (!result.success) {
    throw new Error(result.error ?? 'Approval failed');
  }

  return {
    id: proposal.id,
    documentId: proposal.documentId,
    sourceVersionId: proposal.sourceVersionId,
    agentId: proposal.actorId,
    taskDescription: proposal.rationale,
    proposedContent: proposal.proposedContent,
    approvalStatus: proposal.status,
    approvedBy: proposal.approvedBy,
    approvedAt: proposal.approvedAt,
    resultingVersionId: proposal.resultingVersionId,
    createdAt: proposal.createdAt,
  };
}

/**
 * Rejects an AI proposal.
 */
export async function rejectProposal(
  proposalId: string,
  rejectedBy: string
): Promise<AIProposal> {
  const proposal = proposalManager.getProposal(proposalId);
  if (!proposal) {
    throw new Error(`Proposal ${proposalId} not found`);
  }

  const result = proposalManager.rejectProposal(proposalId, rejectedBy);
  if (!result.success) {
    throw new Error(result.error ?? 'Rejection failed');
  }

  return {
    id: proposal.id,
    documentId: proposal.documentId,
    sourceVersionId: proposal.sourceVersionId,
    agentId: proposal.actorId,
    taskDescription: proposal.rationale,
    proposedContent: proposal.proposedContent,
    approvalStatus: proposal.status,
    approvedBy: proposal.approvedBy,
    approvedAt: proposal.approvedAt,
    resultingVersionId: proposal.resultingVersionId,
    createdAt: proposal.createdAt,
  };
}

/**
 * Answers questions about document history grounded strictly in structured evidence.
 */
export async function answerHistoryQuestion(
  _documentId: string,
  question: string,
  _userId: string
): Promise<{ answer: string; sources: string[] }> {
  const result = await answerHistoryQuestionEngine(
    question,
    [],
    [],
    [],
    gateway
  );

  return {
    answer: result.answer ?? result.message ?? 'No history information available.',
    sources: result.sourceVersionIds ?? [],
  };
}
