import React from 'react';
import { Link } from 'react-router-dom';

export function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <p className="font-mono text-xs text-ink-muted">404</p>
      <h1 className="mt-2 font-serif text-3xl text-ink">Nothing here</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        This page does not exist, or it is not available to your account.
      </p>
      <Link
        to="/dashboard"
        className="mt-8 inline-block rounded-lg bg-sage-600 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-150 ease-serene hover:bg-sage-700">
        
        Back to overview
      </Link>
    </div>);

}