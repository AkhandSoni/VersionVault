import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('akhand@versionvault.app');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (password.length < 6) {
      setError('Enter the password for this account to continue.');
      return;
    }
    setError(null);
    setPending(true);
    window.setTimeout(() => navigate('/dashboard'), 500);
  }

  return (
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
          <p id="login-error" role="alert" className="rounded-lg bg-orange-100 border border-orange-200 px-3.5 py-2.5 text-xs font-semibold text-orange-950">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-all duration-150 ease-serene hover:from-orange-500 hover:to-amber-500 disabled:from-stone-200 disabled:to-stone-200 disabled:text-stone-500">
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>
  );
}