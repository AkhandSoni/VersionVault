import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';

export function NotFound() {
  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <span className="font-mono text-xs font-semibold uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full border border-orange-200">
        404 · Not Found
      </span>
      <h1 className="mt-4 font-serif text-3xl font-semibold text-ink">Page not found</h1>
      <p className="mt-2 text-sm leading-relaxed text-ink-muted">
        This resource does not exist, or you do not have permission to view it.
      </p>
      <Link
        to="/dashboard"
        className="mt-8 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2.5 text-sm font-semibold text-white shadow-xs transition-all hover:from-orange-500 hover:to-amber-500">
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Overview
      </Link>
    </div>
  );
}