// ============================================================
// VersionVault — Canonical Domain Types (Person 1)
// Source of truth: PRD.md §12 and PROJECT_CONTEXT.md
// ============================================================

// ----------------------------------------------------------------
// Core domain entities
// ----------------------------------------------------------------

export type User = {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
};

export type Tenant = {
  id: string;
  name: string;
  createdAt: string;
};

export type Membership = {
  id: string;
  userId: string;
  tenantId: string;
  role: 'OWNER' | 'CONTRIBUTOR' | 'VIEWER';
  createdAt: string;
};

export type Document = {
  id: string;
  tenantId: string;
  title: string;
  currentVersionId: string | null;
  defaultBranchId: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  /** Effective access role for the authenticated caller, when known. */
  accessRole?: Membership['role'];
};

export type Version = {
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
};

export type Branch = {
  id: string;
  documentId: string;
  tenantId: string;
  name: string;
  headVersionId: string | null;
  baseVersionId: string | null;
  status: 'ACTIVE' | 'ARCHIVED';
  createdBy: string;
  createdAt: string;
};

export type Collaborator = {
  id: string;
  documentId: string;
  userId: string;
  role: 'OWNER' | 'CONTRIBUTOR' | 'VIEWER';
  addedBy: string;
  createdAt: string;
};

export type StorageObject = {
  id: string;
  tenantId: string;
  documentId: string;
  versionId: string;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  contentHash: string;
  createdAt: string;
};

export type StructuredChange = {
  id: string;
  baseVersionId: string;
  targetVersionId: string;
  type: 'ADDED' | 'REMOVED' | 'MODIFIED' | 'MOVED';
  section?: string;
  oldValue?: string;
  newValue?: string;
  category?: 'FINANCIAL' | 'CONTRACTUAL' | 'OPERATIONAL' | 'TECHNICAL' | 'CONTENT' | 'GENERAL';
  severity?: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence?: number;
};

export type ProcessingJob = {
  id: string;
  versionId: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  attemptCount: number;
  error?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
};

export type ActivityEvent = {
  id: string;
  tenantId: string;
  documentId?: string;
  versionId?: string;
  actorId: string;
  actorType: 'human' | 'ai_agent';
  eventType: ActivityEventType;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export type ActivityEventType =
  | 'DOCUMENT_CREATED'
  | 'DOCUMENT_DELETED'
  | 'VERSION_CREATED'
  | 'VERSION_READY'
  | 'VERSION_FAILED'
  | 'CHANGE_DETECTED'
  | 'BRANCH_CREATED'
  | 'AI_PROPOSAL_CREATED'
  | 'AI_PROPOSAL_APPROVED'
  | 'AI_PROPOSAL_REJECTED'
  | 'HUMAN_APPROVAL_RECORDED'
  | 'VERSION_RESTORED'
  | 'PERMISSION_CHANGED'
  | 'DOCUMENT_DOWNLOADED';

export type AIExplanation = {
  id: string;
  baseVersionId: string;
  targetVersionId: string;
  explanation: string;
  affectedAreas: string[];
  status: 'AVAILABLE' | 'PROCESSING' | 'UNAVAILABLE' | 'FAILED';
  model?: string;
  createdAt: string;
};

export type AIProposal = {
  id: string;
  documentId: string;
  sourceVersionId: string;
  agentId: string;
  taskDescription: string;
  proposedContent: string;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  approvedBy?: string;
  approvedAt?: string;
  resultingVersionId?: string;
  createdAt: string;
};
