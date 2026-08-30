import { describe, expect, it } from 'vitest';
import { AppError, toApiError } from '../src/lib/errors';
import { mapDocument } from '../src/lib/api-client';
import { isIdempotencySchemaUnavailable } from '../src/services/idempotency.service';
import { versionsOnBranch } from '../src/utils/documents';

describe('strict version-control contracts', () => {
  it('maps the server access role instead of presenting every caller as owner', () => {
    const version = {
      id: 'version-1',
      documentId: 'document-1',
      parentVersionId: null,
      branchId: 'main-branch',
      versionNumber: 1,
      contentHash: 'content-hash',
      versionHash: 'version-hash',
      mimeType: 'text/plain',
      fileSize: 4,
      createdBy: 'user-1',
      status: 'READY',
      createdAt: '2026-08-31T00:00:00.000Z',
    } as Parameters<typeof mapDocument>[1][number];

    const document = mapDocument(
      {
        id: 'document-1',
        tenantId: 'tenant-1',
        title: 'Read-only document',
        currentVersionId: 'version-1',
        defaultBranchId: 'main-branch',
        createdBy: 'user-1',
        createdAt: '2026-08-31T00:00:00.000Z',
        updatedAt: '2026-08-31T00:00:00.000Z',
        accessRole: 'VIEWER',
      },
      [version],
      [{ id: 'main-branch', name: 'main', headVersionId: 'version-1', baseVersionId: null }],
      new Map(),
    );

    expect(document.role).toBe('Viewer');
  });

  it('includes a branch base version when showing branch history', () => {
    const document = {
      id: 'document-1',
      title: 'Contract',
      reference: 'DOC-1',
      role: 'Owner',
      branches: ['main', 'review'],
      branchDetails: [{ id: 'review', name: 'review', headVersionId: 'version-2', baseVersionId: 'version-1' }],
      currentVersionId: 'version-2',
      updatedAt: '2026-08-31T00:00:00.000Z',
      versionCount: 2,
      reviewNeeded: false,
      integrity: 'verified',
      versions: [
        { id: 'version-1', label: 'V1', parentId: null, branch: 'main', author: 'u', timestamp: '2026-08-30T00:00:00.000Z', status: 'main', hash: 'h1', source: 'x', summary: 'x', changes: [] },
        { id: 'version-2', label: 'V2', parentId: 'version-1', branch: 'review', author: 'u', timestamp: '2026-08-31T00:00:00.000Z', status: 'branch', hash: 'h2', source: 'x', summary: 'x', changes: [] },
      ],
    } as Parameters<typeof versionsOnBranch>[0];

    expect(versionsOnBranch(document, 'review').map((version) => version.id)).toEqual(['version-1', 'version-2']);
  });

  it('does not expose internal database messages through API errors', () => {
    expect(toApiError(new AppError('SQL relation details', 'DOCUMENTS_LIST_FAILED', 500))).toEqual({
      error: 'DOCUMENTS_LIST_FAILED',
      message: 'The request could not be completed safely.',
      statusCode: 500,
    });
  });

  it('only fails open for a missing idempotency migration', () => {
    expect(isIdempotencySchemaUnavailable({
      code: '42P01',
      message: 'relation "public.idempotency_keys" does not exist',
    })).toBe(true);
    expect(isIdempotencySchemaUnavailable({
      code: 'PGRST205',
      message: 'Could not find the table idempotency_keys in the schema cache',
    })).toBe(true);
    expect(isIdempotencySchemaUnavailable({
      code: '57014',
      message: 'canceling statement due to statement timeout',
    })).toBe(false);
  });
});
