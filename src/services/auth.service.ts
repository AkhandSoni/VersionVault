// ============================================================
// VersionVault — Auth Service (Person 1)
// Wrapper around Supabase Auth.
// ============================================================

// TODO: Implement authentication workflows
//   - register user with email + password
//   - login user
//   - logout user
//   - get current authenticated user

import type { User, RegisterRequest, LoginRequest } from '@/types';

export async function register(
  _data: RegisterRequest,
): Promise<{ user: User | null; session: unknown }> {
  throw new Error('auth.register not implemented');
}

export async function login(
  _data: LoginRequest,
): Promise<{ user: User | null; session: unknown }> {
  throw new Error('auth.login not implemented');
}

export async function logout(): Promise<void> {
  throw new Error('auth.logout not implemented');
}

export async function getCurrentUser(): Promise<User | null> {
  throw new Error('auth.getCurrentUser not implemented');
}
