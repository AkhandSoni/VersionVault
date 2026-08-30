import { ConflictError, AppError, ValidationError } from '@/lib/errors';
import { createServiceClient } from '@/lib/supabase/server';

const MAX_IDEMPOTENCY_KEY_LENGTH = 200;

/**
 * Idempotency is an operational safety layer added by migration 009. Keep
 * uploads usable during a rolling deployment where the application is newer
 * than the database, but never hide an arbitrary database outage.
 */
export function isIdempotencySchemaUnavailable(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const candidate = error as { code?: unknown; message?: unknown; details?: unknown };
  const code = typeof candidate.code === 'string' ? candidate.code : '';
  const text = [candidate.message, candidate.details]
    .filter((value): value is string => typeof value === 'string')
    .join(' ')
    .toLowerCase();

  return (
    code === '42P01' ||
    code === 'PGRST205' ||
    (text.includes('idempotency_keys') && (text.includes('does not exist') || text.includes('schema cache')))
  );
}

export type IdempotencyClaim = {
  id: string;
  state: 'new' | 'replay' | 'in_flight';
  responseBody?: unknown;
  responseStatus?: number;
};

/**
 * Claims a retry key in the service-only table. A key is scoped to the
 * authenticated actor and operation, and cannot be reused for a different
 * request fingerprint.
 */
export async function claimIdempotency(params: {
  userId: string;
  operation: string;
  key?: string | null;
  requestHash: string;
}): Promise<IdempotencyClaim | null> {
  const key = params.key?.trim();
  if (!key) return null;
  if (key.length > MAX_IDEMPOTENCY_KEY_LENGTH) {
    throw new ValidationError(`Idempotency-Key must be at most ${MAX_IDEMPOTENCY_KEY_LENGTH} characters`);
  }

  const supabase = await createServiceClient();
  const row = {
    user_id: params.userId,
    operation: params.operation,
    idempotency_key: key,
    request_hash: params.requestHash,
    status: 'IN_FLIGHT',
  };

  const { data: existing, error: existingError } = await supabase
    .from('idempotency_keys')
    .select('id, request_hash, status, response_status, response_body')
    .eq('user_id', params.userId)
    .eq('operation', params.operation)
    .eq('idempotency_key', key)
    .maybeSingle();

  if (existingError) {
    if (isIdempotencySchemaUnavailable(existingError)) return null;
    throw new AppError('Could not read request idempotency state', 'IDEMPOTENCY_UNAVAILABLE', 503);
  }
  if (existing) return interpretClaim(existing, params.requestHash);

  const { error: insertError } = await supabase
    .from('idempotency_keys')
    .insert(row);

  if (!insertError) {
    const { data: inserted, error: insertedReadError } = await supabase
      .from('idempotency_keys')
      .select('id')
      .eq('user_id', params.userId)
      .eq('operation', params.operation)
      .eq('idempotency_key', key)
      .single();
    if (insertedReadError && isIdempotencySchemaUnavailable(insertedReadError)) return null;
    if (!inserted) throw new AppError('Could not establish request idempotency', 'IDEMPOTENCY_UNAVAILABLE', 503);
    return { id: inserted.id, state: 'new' };
  }

  if (isIdempotencySchemaUnavailable(insertError)) return null;

  // A concurrent request may have won the unique constraint. Read its state
  // and let the caller return 409 while that request is still running.
  const { data: stored, error: readError } = await supabase
    .from('idempotency_keys')
    .select('id, request_hash, status, response_status, response_body')
    .eq('user_id', params.userId)
    .eq('operation', params.operation)
    .eq('idempotency_key', key)
    .maybeSingle();
  if (readError || !stored) {
    if (isIdempotencySchemaUnavailable(readError)) return null;
    throw new AppError('Could not establish request idempotency', 'IDEMPOTENCY_UNAVAILABLE', 503);
  }
  return interpretClaim(stored, params.requestHash);
}

function interpretClaim(
  stored: { id: string; request_hash: string; status: string; response_status: number | null; response_body: unknown },
  requestHash: string,
): IdempotencyClaim {
  if (stored.request_hash !== requestHash) {
    throw new ConflictError('Idempotency-Key was already used for a different request');
  }
  if (stored.status === 'COMPLETED') {
    return {
      id: stored.id,
      state: 'replay',
      responseBody: stored.response_body,
      responseStatus: stored.response_status ?? 200,
    };
  }
  return { id: stored.id, state: 'in_flight' };
}

export async function completeIdempotency(
  id: string,
  responseBody: unknown,
  responseStatus: number,
): Promise<void> {
  const supabase = await createServiceClient();
  const { error } = await supabase
    .from('idempotency_keys')
    .update({
      status: 'COMPLETED',
      response_body: responseBody,
      response_status: responseStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);
  if (error && !isIdempotencySchemaUnavailable(error)) {
    throw new AppError('Could not persist request idempotency state', 'IDEMPOTENCY_UNAVAILABLE', 503);
  }
}

export async function releaseIdempotency(id: string): Promise<void> {
  const supabase = await createServiceClient();
  await supabase.from('idempotency_keys').delete().eq('id', id);
}
