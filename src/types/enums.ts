// ============================================================
// VersionVault — Enums (re-exported from domain for convenience)
// ============================================================

export type VersionStatus = 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED';
export type BranchStatus = 'ACTIVE' | 'ARCHIVED';
export type ProcessingJobStatus = 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
export type AIStatus = 'AVAILABLE' | 'PROCESSING' | 'UNAVAILABLE' | 'FAILED';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CollaboratorRole = 'OWNER' | 'CONTRIBUTOR' | 'VIEWER';
export type Permission = CollaboratorRole;

export type ChangeType = 'ADDED' | 'REMOVED' | 'MODIFIED' | 'MOVED';
export type ChangeCategory = 'FINANCIAL' | 'CONTRACTUAL' | 'OPERATIONAL' | 'TECHNICAL' | 'CONTENT' | 'GENERAL';
export type ChangeSeverity = 'LOW' | 'MEDIUM' | 'HIGH';
export type ActorType = 'human' | 'ai_agent';
