// ============================================================
// VersionVault — Auth Service (Person 1)
// Wrapper around Supabase Auth + Multi-Tenant Provisioning.
// ============================================================

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { UnauthorizedError, ValidationError, AppError } from '@/lib/errors';
import type { User, RegisterRequest, LoginRequest } from '@/types';

export const MIN_PASSWORD_LENGTH = 12;

/**
 * Every authenticated user needs a workspace before they can create
 * documents. OAuth users do not pass through the password-registration flow,
 * and older users may have been created while provisioning was unavailable,
 * so this operation is intentionally safe to call on every sign-in.
 */
export async function ensurePersonalWorkspace(userId: string, email: string): Promise<string> {
  const serviceSupabase = await createServiceClient();
  const { data: existingMembership, error: membershipLookupError } = await serviceSupabase
    .from('memberships')
    .select('tenant_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipLookupError) {
    throw new AppError('Could not load the account workspace', 'WORKSPACE_PROVISIONING_FAILED', 503);
  }
  if (existingMembership?.tenant_id) return existingMembership.tenant_id;

  const workspaceName = `${email.split('@')[0] || 'User'}'s Workspace`;
  const { data: tenant, error: tenantError } = await serviceSupabase
    .from('tenants')
    .insert({ name: workspaceName })
    .select('id')
    .single();

  if (tenantError || !tenant) {
    throw new AppError('Could not create the account workspace', 'WORKSPACE_PROVISIONING_FAILED', 503);
  }

  const { error: membershipError } = await serviceSupabase.from('memberships').insert({
    user_id: userId,
    tenant_id: tenant.id,
    role: 'OWNER',
  });

  if (membershipError) {
    // A parallel sign-in may have provisioned the account between our lookup
    // and insert. Return that workspace when possible instead of failing.
    const { data: concurrentMembership } = await serviceSupabase
      .from('memberships')
      .select('tenant_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (concurrentMembership?.tenant_id) return concurrentMembership.tenant_id;
    throw new AppError('Could not create the account workspace', 'WORKSPACE_PROVISIONING_FAILED', 503);
  }

  return tenant.id;
}

/**
 * Register a new user and automatically provision a default Personal tenant + OWNER membership.
 */
export async function register(
  data: RegisterRequest,
): Promise<{ user: User | null; session: unknown; tenantId?: string }> {
  const email = normalizeEmail(data.email);
  const fullName = data.fullName?.trim();

  if (!email || !data.password) {
    throw new ValidationError('Email and password are required');
  }

  if (!isEmail(email)) {
    throw new ValidationError('Enter a valid email address');
  }

  if (data.password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password: data.password,
    options: {
      data: {
        full_name: fullName,
        name: fullName,
      },
    },
  });

  if (error) {
    throw new AppError(error.message, 'AUTH_REGISTRATION_FAILED', 400);
  }

  if (!authData.user) {
    return { user: null, session: null };
  }

  const userId = authData.user.id;
  const tenantId = await ensurePersonalWorkspace(userId, email);

  const user: User = {
    id: authData.user.id,
    email: authData.user.email || email,
    fullName: getFullName(authData.user.user_metadata),
    createdAt: authData.user.created_at || new Date().toISOString(),
  };

  return {
    user,
    session: authData.session,
    tenantId,
  };
}

/**
 * Log in an existing user via Supabase Auth.
 */
export async function login(
  data: LoginRequest,
): Promise<{ user: User | null; session: unknown }> {
  const email = normalizeEmail(data.email);

  if (!email || !data.password) {
    throw new ValidationError('Email and password are required');
  }

  if (!isEmail(email)) {
    throw new ValidationError('Enter a valid email address');
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email,
    password: data.password,
  });

  if (error) {
    throw new UnauthorizedError(error.message);
  }

  if (!authData.user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  await ensurePersonalWorkspace(authData.user.id, authData.user.email || email);

  const user: User = {
    id: authData.user.id,
    email: authData.user.email || email,
    fullName: getFullName(authData.user.user_metadata),
    createdAt: authData.user.created_at || new Date().toISOString(),
  };

  return {
    user,
    session: authData.session,
  };
}

/**
 * Log out the currently authenticated user.
 */
export async function logout(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AppError(error.message, 'LOGOUT_FAILED', 500);
  }
}

/**
 * Get the currently authenticated user.
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();

  if (error || !authUser) {
    return null;
  }

  return {
    id: authUser.id,
    email: authUser.email || '',
    fullName: getFullName(authUser.user_metadata),
    createdAt: authUser.created_at || new Date().toISOString(),
  };
}

function getFullName(metadata: Record<string, unknown> | null | undefined): string | undefined {
  const fullName = metadata?.full_name ?? metadata?.name;
  return typeof fullName === 'string' && fullName.trim() ? fullName.trim() : undefined;
}

function normalizeEmail(email: unknown): string {
  return typeof email === 'string' ? email.trim().toLowerCase() : '';
}

function isEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
