import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChromeIcon } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useVaultData } from '../lib/vault-data';
import * as api from '../lib/api-client';

export function Register() {
  const navigate = useNavigate();
  const { refresh } = useVaultData();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!name.trim() || !normalizedEmail.includes('@') || password.length < 8) {
      setError('Add your name, a valid email, and a password of at least 8 characters.');
      return;
    }

    setError(null);
    setSuccess(null);
    setPending(true);
    try {
      const result = await api.register(normalizedEmail, password, name.trim());
      if (result.needsEmailConfirmation) {
        setSuccess(result.message || 'Check your email to confirm your account, then sign in.');
        return;
      }

      const loaded = await refresh();
      if (!loaded) {
        throw new Error('Account created, but the workspace could not be loaded.');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create this account.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Start a workspace where every revision keeps its own verifiable record."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-orange-700 underline decoration-orange-300 underline-offset-4 hover:text-orange-900">
            Sign in
          </Link>
        </>
      }>
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <button
          type="button"
          onClick={api.beginGoogleSignIn}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-semibold text-ink shadow-xs transition-colors hover:bg-orange-50 hover:border-orange-200">
          <ChromeIcon className="h-4 w-4 text-orange-600" />
          Continue with Google
        </button>

        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
          <span className="h-px flex-1 bg-line" />
          Email
          <span className="h-px flex-1 bg-line" />
        </div>

        <div>
          <label htmlFor="name" className="label-eyebrow text-ink-muted font-medium">
            Full name
          </label>
          <input
            id="name"
            value={name}
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
        </div>

        <div>
          <label htmlFor="register-email" className="label-eyebrow text-ink-muted font-medium">
            Work email
          </label>
          <input
            id="register-email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
        </div>

        <div>
          <label htmlFor="register-password" className="label-eyebrow text-ink-muted font-medium">
            Password
          </label>
          <input
            id="register-password"
            type="password"
            value={password}
            autoComplete="new-password"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'register-error' : 'password-hint'}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />

          <p id="password-hint" className="mt-1.5 text-xs text-ink-muted">
            At least 8 characters.
          </p>
        </div>

        {error ? (
          <p id="register-error" role="alert" className="rounded-lg border border-orange-200 bg-orange-100 px-3.5 py-2.5 text-xs font-semibold text-orange-950">
            {error}
          </p>
        ) : null}

        {success ? (
          <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-semibold text-emerald-900">
            {success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-all duration-150 ease-serene hover:from-orange-500 hover:to-amber-500 disabled:from-stone-200 disabled:to-stone-200 disabled:text-stone-500">
          {pending ? 'Creating account...' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
