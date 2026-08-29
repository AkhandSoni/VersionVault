// ============================================================
// VersionVault — Collaborator Service (Person 1)
// ============================================================

// TODO: Implement collaborator management
//   - add collaborator to document
//   - remove collaborator
//   - list collaborators
//   - update permission

import type { Collaborator, Permission } from '@/types';

export async function addCollaborator(
  _userId: string,
  _documentId: string,
  _targetUserId: string,
  _permission: Permission,
): Promise<Collaborator> {
  throw new Error('collaborator.add not implemented');
}

export async function removeCollaborator(
  _userId: string,
  _documentId: string,
  _targetUserId: string,
): Promise<void> {
  throw new Error('collaborator.remove not implemented');
}

export async function listCollaborators(
  _userId: string,
  _documentId: string,
): Promise<Collaborator[]> {
  throw new Error('collaborator.list not implemented');
}

export async function updatePermission(
  _userId: string,
  _documentId: string,
  _targetUserId: string,
  _permission: Permission,
): Promise<Collaborator> {
  throw new Error('collaborator.updatePermission not implemented');
}
