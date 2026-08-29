/**
 * VersionVault — Shared Domain Contracts (Person 2)
 * Grounded Evidence & Intelligence Data Models
 */

export type ChangeType = "ADDED" | "REMOVED" | "MODIFIED" | "MOVED";

export type MaterialityCategory =
  | "FINANCIAL"
  | "CONTRACTUAL"
  | "OPERATIONAL"
  | "TECHNICAL"
  | "CONTENT"
  | "GENERAL";

export type SeverityLevel = "LOW" | "MEDIUM" | "HIGH";

export interface StructuredChange {
  id: string;
  baseVersionId: string;
  targetVersionId: string;
  type: ChangeType;
  section?: string;
  oldValue?: string;
  newValue?: string;
  category?: MaterialityCategory;
  severity?: SeverityLevel;
  confidence?: number; // 0.0 to 1.0 for classification confidence
  location?: {
    lineStart?: number;
    lineEnd?: number;
    charStart?: number;
    charEnd?: number;
  };
}

export type VersionStatus = "UPLOADING" | "PROCESSING" | "READY" | "FAILED";

export interface Version {
  id: string;
  documentId: string;
  parentVersionId: string | null;
  branchId: string;
  versionNumber: number;
  contentHash: string; // SHA-256 hex string of content
  versionHash?: string;
  storageObjectId: string;
  mimeType: string;
  fileSize: number;
  createdBy: string;
  message?: string;
  status: VersionStatus;
  restoreSourceVersionId?: string | null;
  createdAt: string;
}

export interface Document {
  id: string;
  tenantId: string;
  title: string;
  defaultBranchId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProvenanceRecord {
  changeId: string;
  targetVersionId: string;
  documentId: string;
  actorId: string;
  actorType: "user" | "ai_agent" | "system";
  branchId: string;
  timestamp: string;
  storageObjectId: string;
  contentHash: string;
  verifiedIntegrity: boolean;
}

export interface LineBlame {
  lineNumber: number;
  content: string;
  versionId: string;
  versionNumber: number;
  authorId: string;
  authorType: "user" | "ai_agent" | "system";
  timestamp: string;
  commitMessage?: string;
  changeId?: string;
}

export interface SectionBlame {
  sectionTitle: string;
  lastModifiedVersionId: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  changeHistory: {
    versionId: string;
    versionNumber: number;
    authorId: string;
    changeType: ChangeType;
    summary: string;
  }[];
}

export interface AIExplanationResult {
  status: "AVAILABLE" | "UNAVAILABLE";
  explanation?: {
    summary: string;
    businessImpact: string;
    riskAssessment: string;
    referencedChangeIds: string[];
    confidence: number;
  };
  message?: string; // e.g. "AI is not accessible at this moment, kindly try again later"
  retryable?: boolean;
}

export type AIProposalStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface AIProposal {
  id: string;
  documentId: string;
  branchId: string;
  sourceVersionId: string; // Base version against which proposal was made
  proposedContent: string;
  rationale: string;
  actorType: "ai_agent";
  actorId: string;
  model: string;
  taskId: string;
  status: AIProposalStatus;
  createdAt: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  resultingVersionId?: string;
}

export interface ActivityEvent {
  id: string;
  tenantId: string;
  documentId: string;
  versionId?: string;
  actorId: string;
  actorType: "user" | "ai_agent" | "system";
  eventType:
    | "DOCUMENT_CREATED"
    | "VERSION_CREATED"
    | "VERSION_RESTORED"
    | "BRANCH_CREATED"
    | "AI_PROPOSAL_CREATED"
    | "AI_PROPOSAL_APPROVED"
    | "AI_PROPOSAL_REJECTED"
    | "COLLABORATOR_ADDED"
    | "COLLABORATOR_REMOVED";
  timestamp: string;
  metadata?: Record<string, unknown>;
}
