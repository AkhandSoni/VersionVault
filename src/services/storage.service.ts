// ============================================================
// VersionVault — Storage Service (Person 1)
// Uses Supabase Storage — private bucket only.
// ============================================================

// TODO: Implement private object storage
//   - upload file to private bucket
//   - download / get signed URL
//   - delete object
//   - path follows: {tenantId}/{documentId}/{versionId}/{objectId}

export async function uploadObject(
  _tenantId: string,
  _documentId: string,
  _versionId: string,
  _objectId: string,
  _data: Buffer,
  _mimeType: string,
): Promise<{ path: string }> {
  throw new Error('storage.upload not implemented');
}

export async function getSignedUrl(
  _path: string,
  _expiresInSeconds?: number,
): Promise<string> {
  throw new Error('storage.getSignedUrl not implemented');
}

export async function deleteObject(
  _path: string,
): Promise<void> {
  throw new Error('storage.delete not implemented');
}
