import React from 'react';
import { Link } from 'react-router-dom';

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="flex min-h-full w-full items-center justify-center bg-canvas px-4 py-16">
      <div className="w-full max-w-sm">
        <Link to="/" className="flex items-center gap-2.5">
          <span aria-hidden="true" className="h-6 w-6 rounded-md border border-sage-200 bg-sage-50" />
          <span className="font-serif text-lg text-ink">VersionVault</span>
        </Link>

        <h1 className="mt-10 font-serif text-3xl leading-tight text-ink">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">{subtitle}</p>

        <div className="mt-8">{children}</div>

        <p className="mt-8 text-sm text-ink-muted">{footer}</p>
      </div>
    </div>);

}