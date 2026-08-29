// ============================================================
// VersionVault — Shared Contracts Bridge
// Unifies domain entities and Person 2 diff/AI/provenance models.
// ============================================================

export * from './domain';
export * from './enums';
export * from './api';

export type MaterialityCategory =
  | 'FINANCIAL'
  | 'CONTRACTUAL'
  | 'OPERATIONAL'
  | 'TECHNICAL'
  | 'CONTENT'
  | 'GENERAL';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export type ChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'MOVED';

export interface StructuredChangeLocation {
  lineStart?: number;
  lineEnd?: number;
  charStart?: number;
  charEnd?: number;
}

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
  confidence?: number;
  location?: StructuredChangeLocation;
}

export interface ProvenanceRecord {
  changeId: string;
  targetVersionId: string;
  documentId: string;
  actorId: string;
  actorType: 'human' | 'user' | 'ai_agent';
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
  authorType: 'human' | 'user' | 'ai_agent';
  timestamp: string;
  commitMessage?: string;
}

export interface SectionBlameHistoryItem {
  versionId: string;
  versionNumber: number;
  authorId: string;
  changeType: ChangeType;
  summary: string;
}

export interface SectionBlame {
  sectionTitle: string;
  lastModifiedVersionId: string;
  lastModifiedBy: string;
  lastModifiedAt: string;
  changeHistory: SectionBlameHistoryItem[];
}

export interface AIExplanationResult {
  status: 'AVAILABLE' | 'PROCESSING' | 'UNAVAILABLE' | 'FAILED';
  explanation?: {
    summary: string;
    businessImpact: string;
    riskAssessment: string;
    referencedChangeIds: string[];
    confidence: number;
  };
  message?: string;
  retryable?: boolean;
}

export interface AIProposal {
  id: string;
  documentId: string;
  branchId: string;
  sourceVersionId: string;
  proposedContent: string;
  rationale?: string;
  taskDescription?: string;
  actorType?: 'human' | 'user' | 'ai_agent';
  actorId?: string;
  agentId?: string;
  model?: string;
  taskId?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  rejectedBy?: string;
  rejectedAt?: string;
  resultingVersionId?: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  tenantId: string;
  documentId?: string;
  versionId?: string;
  actorId: string;
  actorType: 'human' | 'user' | 'ai_agent';
  eventType: string;
  timestamp?: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface Document {
  id: string;
  tenantId: string;
  title: string;
  currentVersionId?: string | null;
  defaultBranchId?: string | null;
  ownerId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Version {
  id: string;
  documentId: string;
  parentVersionId: string | null;
  branchId: string;
  versionNumber: number;
  contentHash: string;
  versionHash?: string;
  storageObjectId: string;
  mimeType: string;
  fileSize: number;
  createdBy: string;
  message?: string;
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
  restoreSourceVersionId?: string | null;
  createdAt: string;
}
