// ============================================================
// VersionVault — API Request / Response Types
// ============================================================

import type { Document, Version, Branch, Collaborator, ActivityEvent, StructuredChange } from './domain';

// ----------------------------------------------------------------
// Shared
// ----------------------------------------------------------------

export type PaginatedResponse<T> = {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type ApiError = {
  error: string;
  message: string;
  statusCode?: number;
};

// ----------------------------------------------------------------
// Auth
// ----------------------------------------------------------------

export type RegisterRequest = {
  email: string;
  password: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type AuthResponse = {
  user: {
    id: string;
    email: string;
  };
};

// ----------------------------------------------------------------
// Documents
// ----------------------------------------------------------------

export type CreateDocumentRequest = {
  title: string;
  tenantId: string;
};

export type UpdateDocumentRequest = {
  title?: string;
};

export type DocumentResponse = Document;

// ----------------------------------------------------------------
// Versions
// ----------------------------------------------------------------

export type CreateVersionRequest = {
  message?: string;
  branchId?: string;
  parentVersionId?: string;
  // file: multipart/form-data
};

export type RestoreVersionRequest = {
  message?: string;
  branchId?: string;
};

export type VersionContentResponse = {
  signedUrl: string;
  expiresAt: string;
};

// ----------------------------------------------------------------
// Branches
// ----------------------------------------------------------------

export type CreateBranchRequest = {
  name: string;
  baseVersionId: string;
};

export type BranchResponse = Branch;

// ----------------------------------------------------------------
// Collaborators
// ----------------------------------------------------------------

export type AddCollaboratorRequest = {
  userId: string;
  role: 'CONTRIBUTOR' | 'VIEWER';
};

export type CollaboratorResponse = Collaborator;

// ----------------------------------------------------------------
// Diff
// ----------------------------------------------------------------

export type DiffResponse = {
  baseVersionId: string;
  targetVersionId: string;
  changes: StructuredChange[];
  materialChangeCount: number;
};

// ----------------------------------------------------------------
// Graph
// ----------------------------------------------------------------

export type VersionGraphNode = {
  version: Version;
  children: string[]; // version IDs
};

export type GraphResponse = {
  documentId: string;
  nodes: Record<string, VersionGraphNode>;
  rootVersionId: string | null;
};

// ----------------------------------------------------------------
// Activity
// ----------------------------------------------------------------

export type ActivityResponse = PaginatedResponse<ActivityEvent>;
