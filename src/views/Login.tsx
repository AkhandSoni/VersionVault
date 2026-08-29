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
          <Link to="/register" className="text-sage-700 underline decoration-sage-200 underline-offset-4">
            Create one
          </Link>
        </>
      }>
      
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="email" className="label-eyebrow">
            Work email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted" />
          
        </div>

        <div>
          <label htmlFor="password" className="label-eyebrow">
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
            className="mt-1.5 w-full rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm text-ink" />
          
        </div>

        {error ?
        <p id="login-error" role="alert" className="rounded-lg bg-clay-50 px-3.5 py-2.5 text-xs text-clay-700">
            {error}
          </p> :
        null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 ease-serene hover:bg-sage-700 disabled:bg-sage-300">
          
          {pending ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </AuthLayout>);

}