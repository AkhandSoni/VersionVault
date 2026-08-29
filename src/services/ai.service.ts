// ============================================================
// VersionVault — AI Service (Person 2)
// Server-only — uses OpenRouter.
// ============================================================

// TODO: Implement AI intelligence layer
//   - generate grounded explanation from StructuredChange[]
//   - create AI proposal
//   - approve / reject proposal
//   - answer history questions from authorized evidence

import type { AIExplanation, AIProposal } from '@/types';

export async function getExplanation(
  _baseVersionId: string,
  _targetVersionId: string,
): Promise<AIExplanation> {
  throw new Error('ai.getExplanation not implemented');
}

export async function createProposal(
  _documentId: string,
  _sourceVersionId: string,
  _taskDescription: string,
  _agentId: string,
): Promise<AIProposal> {
  throw new Error('ai.createProposal not implemented');
}

export async function approveProposal(
  _proposalId: string,
  _approvedBy: string,
): Promise<AIProposal> {
  throw new Error('ai.approveProposal not implemented');
}

export async function rejectProposal(
  _proposalId: string,
  _rejectedBy: string,
): Promise<AIProposal> {
  throw new Error('ai.rejectProposal not implemented');
}

export async function answerHistoryQuestion(
  _documentId: string,
  _question: string,
  _userId: string,
): Promise<{ answer: string; sources: string[] }> {
  throw new Error('ai.answerHistoryQuestion not implemented');
}
