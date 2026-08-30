// ============================================================
// VersionVault — Auth Service (Person 1)
// Wrapper around Supabase Auth + Multi-Tenant Provisioning.
// ============================================================

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { UnauthorizedError, ValidationError, AppError } from '@/lib/errors';
import type { User, RegisterRequest, LoginRequest } from '@/types';

export const MIN_PASSWORD_LENGTH = 8;

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
  let tenantId: string | undefined;

  // Auto-provision a default tenant and OWNER membership using service client
  try {
    const serviceSupabase = await createServiceClient();
    
    // 1. Create default workspace tenant
    const { data: tenantData } = await serviceSupabase
      .from('tenants')
      .insert({ name: `${email.split('@')[0]}'s Workspace` })
      .select('id')
      .single();

    if (tenantData) {
      tenantId = tenantData.id;
      // 2. Insert OWNER membership
      await serviceSupabase.from('memberships').insert({
        user_id: userId,
        tenant_id: tenantId,
        role: 'OWNER',
      });
    }
  } catch {
    // If service client is not configured (e.g. mock/local env), continue gracefully
  }

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
