import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChromeIcon } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { useVaultData } from '../lib/vault-data';
import * as api from '../lib/api-client';

export function Login() {
  const navigate = useNavigate();
  const { refresh } = useVaultData();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail.includes('@') || password.length < 1) {
      setError('Enter a valid email and password to continue.');
      return;
    }

    setError(null);
    setPending(true);
    try {
      await api.login(normalizedEmail, password);
      const loaded = await refresh();
      if (!loaded) {
        throw new Error('Signed in, but the workspace could not be loaded.');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sign in.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div data-testid="page-login">
    <AuthLayout
      title="Sign in"
      subtitle="Your documents and their full history stay exactly as you left them."
      footer={
        <>
          No account yet?{' '}
          <Link to="/register" className="font-semibold text-orange-700 underline decoration-orange-300 underline-offset-4 hover:text-orange-900">
            Create one
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
          <label htmlFor="email" className="label-eyebrow text-ink-muted font-medium">
            Work email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink placeholder:text-ink-muted focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
        </div>

        <div>
          <label htmlFor="password" className="label-eyebrow text-ink-muted font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            autoComplete="current-password"
            aria-invalid={error ? 'true' : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm font-medium text-ink focus:border-orange-500 focus:ring-1 focus:ring-orange-500" />
        </div>

        {error ? (
          <p id="login-error" role="alert" className="rounded-lg border border-orange-200 bg-orange-100 px-3.5 py-2.5 text-xs font-semibold text-orange-950">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-all duration-150 ease-serene hover:from-orange-500 hover:to-amber-500 disabled:from-stone-200 disabled:to-stone-200 disabled:text-stone-500">
          {pending ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
    </div>
  );
}
