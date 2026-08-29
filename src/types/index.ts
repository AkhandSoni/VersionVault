// ============================================================
// VersionVault — Type Barrel & Unified Types
// ============================================================

export * from './domain';
export * from './api';
export * from './enums';

export type ChangeSeverity = 'high' | 'medium' | 'low';

export type ChangeCategory = 'Financial' | 'Legal' | 'Operational' | 'Editorial';

export type VersionStatus =
  | 'current'
  | 'main'
  | 'branch'
  | 'restored'
  | 'processing'
  | 'failed'
  | 'UPLOADING'
  | 'READY';

export type AIStatus = 'processing' | 'available' | 'unavailable' | 'failed' | 'AVAILABLE' | 'UNAVAILABLE';

export type ApprovalState = 'pending' | 'approved' | 'rejected';

export type Role = 'Owner' | 'Editor' | 'Viewer';

export interface StructuredChange {
  id: string;
  section: string;
  previous: string;
  current: string;
  category: ChangeCategory;
  severity: ChangeSeverity;
  material: boolean;
  previousText: string;
  currentText: string;
}

export interface Version {
  id: string;
  label: string;
  parentId: string | null;
  branch: string;
  author: string;
  timestamp: string;
  status: VersionStatus;
  hash: string;
  source: string;
  summary: string;
  changes: StructuredChange[];
}

export interface DocumentRecord {
  id: string;
  title: string;
  reference: string;
  role: Role;
  branches: string[];
  currentVersionId: string;
  updatedAt: string;
  versionCount: number;
  reviewNeeded: boolean;
  integrity: 'verified' | 'unverified';
  versions: Version[];
}

export interface AIExplanation {
  changeId: string;
  question: string;
  body: string;
  basedOn: string;
  agent: string;
  model: string;
  approval: ApprovalState;
}

export interface AIProposal {
  id: string;
  documentId: string;
  branch: string;
  section: string;
  proposed: string;
  rationale: string;
  approval: ApprovalState;
  createdAt: string;
}

export type ActivityType =
  | 'VERSION_CREATED'
  | 'CHANGE_DETECTED'
  | 'BRANCH_CREATED'
  | 'AI_PROPOSAL_CREATED'
  | 'HUMAN_APPROVED'
  | 'VERSION_RESTORED'
  | 'PERMISSION_CHANGED'
  | 'DOCUMENT_DOWNLOADED';

export interface ActivityEvent {
  id: string;
  type: ActivityType;
  actor: string;
  timestamp: string;
  documentId: string;
  documentTitle: string;
  branch: string;
  detail: string;
}

export interface Collaborator {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export type UploadState =
  | 'idle'
  | 'selected'
  | 'uploading'
  | 'processing'
  | 'ready'
  | 'failed';

export type {
  MaterialityCategory,
  SeverityLevel,
  StructuredChangeLocation,
  ProvenanceRecord,
  LineBlame,
  SectionBlameHistoryItem,
  SectionBlame,
  AIExplanationResult,
} from './contracts';
