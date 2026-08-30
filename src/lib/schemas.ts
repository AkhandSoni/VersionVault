// ============================================================
// VersionVault — Shared API boundary schemas
// ============================================================

import { z } from 'zod';
import { ValidationError } from './errors';

const optionalTrimmedString = (max: number) =>
  z.string().trim().min(1).max(max).optional();

export const RegisterRequestSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(12, 'Password must be at least 12 characters').max(128),
  fullName: optionalTrimmedString(200),
});

export const LoginRequestSchema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(1).max(128),
});

export const SessionRequestSchema = z.object({
  accessToken: z.string().min(1).max(4096),
  refreshToken: z.string().min(1).max(4096),
});

export const CreateDocumentRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
  tenantId: z.string().uuid(),
});

export const UpdateDocumentRequestSchema = z.object({
  title: z.string().trim().min(1).max(200),
});

export const CreateBranchRequestSchema = z.object({
  name: z.string().trim().min(1).max(100),
  baseVersionId: z.string().uuid(),
});

export const AddCollaboratorRequestSchema = z.object({
  userId: z.string().uuid(),
  role: z.enum(['CONTRIBUTOR', 'VIEWER']),
});

export const RestoreVersionRequestSchema = z.object({
  message: optionalTrimmedString(500),
  branchId: z.string().uuid().optional(),
});

export const CreateVersionFieldsSchema = z.object({
  message: optionalTrimmedString(500),
  branchId: z.string().uuid().optional(),
});

export const HistoryQuestionSchema = z.object({
  question: z.string().trim().min(1).max(4000),
});

export const CreateProposalRequestSchema = z.object({
  sourceVersionId: z.string().uuid(),
  branchId: z.string().uuid().optional(),
  taskDescription: optionalTrimmedString(1000),
  rationale: optionalTrimmedString(1000),
  agentId: optionalTrimmedString(200),
  proposedContent: z.string().max(10 * 1024 * 1024).default(''),
});

export const ProposalReviewRequestSchema = z.object({
  action: z.enum(['approve', 'reject']),
});

export function parseSchema<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success) {
    const issue = result.error.issues[0];
    const path = issue?.path.length ? ` (${issue.path.join('.')})` : '';
    throw new ValidationError(`${issue?.message ?? 'Invalid request'}${path}`);
  }
  return result.data;
}

export async function parseJson<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Invalid JSON request body');
  }

  return parseSchema(schema, body);
}
