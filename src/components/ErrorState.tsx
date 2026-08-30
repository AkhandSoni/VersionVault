import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangleIcon, LockIcon, ArrowLeftIcon, RotateCcwIcon } from 'lucide-react';

interface ErrorStateProps {
  variant?: 'error' | 'unauthorized' | 'unavailable';
  title?: string;
  description?: string;
  onRetry?: () => void;
}

const copy = {
  error: {
    title: 'Something interrupted this request',
    description: 'The record could not be loaded. Version history is unaffected.',
  },
  unauthorized: {
    title: 'Document Not Available',
    description: 'You do not have access to this document or branch, or it does not exist.',
  },
  unavailable: {
    title: 'Temporarily unavailable',
    description: 'This service is not responding right now. Try again in a moment.',
  },
};

export function ErrorState({ variant = 'error', title, description, onRetry }: ErrorStateProps) {
  const Icon = variant === 'unauthorized' ? LockIcon : AlertTriangleIcon;
  return (
    <div
      className="rounded-2xl border border-line bg-surface px-8 py-14 text-center shadow-xs"
      role="alert">
      
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600 border border-orange-200">
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h3 className="font-serif text-2xl font-semibold text-ink">{title ?? copy[variant].title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
        {description ?? copy[variant].description}
      </p>
      
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-orange-50 hover:border-orange-200">
            <RotateCcwIcon className="h-4 w-4" />
            Retry
          </button>
        ) : null}

        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-5 py-2 text-sm font-medium text-white shadow-xs hover:from-orange-500 hover:to-amber-500 transition-all">
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Overview
        </Link>
      </div>
    </div>
  );
}