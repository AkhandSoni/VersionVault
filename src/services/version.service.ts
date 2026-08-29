// ============================================================
// VersionVault — Version Service (Person 1)
// ============================================================

// TODO: Implement immutable version management
//   - create version (authorize, hash, store, audit)
//   - list versions for document
//   - get version by ID
//   - get version content / download URL
//   - restore version (creates new immutable version)

import type { Version } from '@/types';
import type { PaginatedResponse, RestoreVersionRequest } from '@/types';

export async function createVersion(
  _userId: string,
  _documentId: string,
  _file: Buffer,
  _mimeType: string,
  _message?: string,
): Promise<Version> {
  throw new Error('version.create not implemented');
}

export async function listVersions(
  _userId: string,
  _documentId: string,
  _page?: number,
  _pageSize?: number,
): Promise<PaginatedResponse<Version>> {
  throw new Error('version.list not implemented');
}

export async function getVersion(
  _userId: string,
  _versionId: string,
): Promise<Version | null> {
  throw new Error('version.get not implemented');
}

export async function getVersionContent(
  _userId: string,
  _versionId: string,
): Promise<{ signedUrl: string }> {
  throw new Error('version.getContent not implemented');
}

export async function restoreVersion(
  _userId: string,
  _versionId: string,
  _data: RestoreVersionRequest,
): Promise<Version> {
  throw new Error('version.restore not implemented');
}
