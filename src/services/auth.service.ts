// ============================================================
// VersionVault — Auth Service (Person 1)
// Wrapper around Supabase Auth + Multi-Tenant Provisioning.
// ============================================================

import { createClient, createServiceClient } from '@/lib/supabase/server';
import { UnauthorizedError, ValidationError, AppError } from '@/lib/errors';
import type { User, RegisterRequest, LoginRequest } from '@/types';

/**
 * Register a new user and automatically provision a default Personal tenant + OWNER membership.
 */
export async function register(
  data: RegisterRequest,
): Promise<{ user: User | null; session: unknown; tenantId?: string }> {
  if (!data.email || !data.password) {
    throw new ValidationError('Email and password are required');
  }

  if (data.password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters');
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
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
      .insert({ name: `${data.email.split('@')[0]}'s Workspace` })
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
    email: authData.user.email || data.email,
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
  if (!data.email || !data.password) {
    throw new ValidationError('Email and password are required');
  }

  const supabase = await createClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
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
    email: authData.user.email || data.email,
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
    createdAt: authUser.created_at || new Date().toISOString(),
  };
}
