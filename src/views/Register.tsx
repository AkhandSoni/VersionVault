import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!name.trim() || !email.includes('@') || password.length < 8) {
      setError('Add your name, a valid email, and a password of at least 8 characters.');
      return;
    }
    setError(null);
    setPending(true);
    window.setTimeout(() => navigate('/dashboard'), 500);
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
          <p id="register-error" role="alert" className="rounded-lg bg-orange-100 border border-orange-200 px-3.5 py-2.5 text-xs font-semibold text-orange-950">
            {error}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-xs transition-all duration-150 ease-serene hover:from-orange-500 hover:to-amber-500 disabled:from-stone-200 disabled:to-stone-200 disabled:text-stone-500">
          {pending ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}