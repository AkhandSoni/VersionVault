// ============================================================
// VersionVault — Canonical Error Types
// ============================================================

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * Used when a resource is not found OR when the caller is not
 * authorized to know whether it exists. Never leak resource existence
 * to unauthorized callers. See SECURITY.md §9.
 */
export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflict') {
    super(message, 'CONFLICT', 409);
    this.name = 'ConflictError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class UploadError extends AppError {
  constructor(message: string) {
    super(message, 'UPLOAD_ERROR', 400);
    this.name = 'UploadError';
  }
}

export class StorageError extends AppError {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR', 500);
    this.name = 'StorageError';
  }
}

/**
 * Converts any caught error to a safe API response shape.
 * Never leaks internal details for non-AppError instances.
 */
export function toApiError(err: unknown): { error: string; message: string; statusCode: number } {
  if (err instanceof AppError) {
    return { error: err.code, message: err.message, statusCode: err.statusCode };
  }
  // Generic — don't expose internal error details
  return { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred', statusCode: 500 };
}
