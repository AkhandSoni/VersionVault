// ============================================================
// VersionVault — Document Service (Person 1)
// Handles document metadata & scoped tenant queries.
// ============================================================

// TODO: Implement document operations
//   - create document
//   - get document by ID (with authorization check)
//   - list authorized documents for tenant/user
//   - update document metadata

import type { Document, CreateDocumentRequest, UpdateDocumentRequest, PaginatedResponse } from '@/types';

export async function createDocument(
  _userId: string,
  _data: CreateDocumentRequest,
): Promise<Document> {
  throw new Error('document.create not implemented');
}

export async function getDocument(
  _userId: string,
  _documentId: string,
): Promise<Document | null> {
  throw new Error('document.get not implemented');
}

export async function listDocuments(
  _userId: string,
  _tenantId: string,
  _page?: number,
  _pageSize?: number,
): Promise<PaginatedResponse<Document>> {
  throw new Error('document.list not implemented');
}

export async function updateDocument(
  _userId: string,
  _documentId: string,
  _data: UpdateDocumentRequest,
): Promise<Document> {
  throw new Error('document.update not implemented');
}
