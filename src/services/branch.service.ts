// ============================================================
// VersionVault — Branch Service (Person 1)
// ============================================================

// TODO: Implement branch management
//   - create branch (from a base version)
//   - list branches for document

import type { Branch } from '@/types';
import type { CreateBranchRequest } from '@/types';

export async function createBranch(
  _userId: string,
  _documentId: string,
  _data: CreateBranchRequest,
): Promise<Branch> {
  throw new Error('branch.create not implemented');
}

export async function listBranches(
  _userId: string,
  _documentId: string,
): Promise<Branch[]> {
  throw new Error('branch.list not implemented');
}
