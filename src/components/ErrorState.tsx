import React from 'react';
import { AlertTriangleIcon, LockIcon } from 'lucide-react';

interface ErrorStateProps {
  variant?: 'error' | 'unauthorized' | 'unavailable';
  title?: string;
  description?: string;
  onRetry?: () => void;
}

const copy = {
  error: {
    title: 'Something interrupted this request',
    description: 'The record could not be loaded. Version history is unaffected.'
  },
  unauthorized: {
    title: 'Not available',
    description: 'You do not have access to this resource, or it does not exist.'
  },
  unavailable: {
    title: 'Temporarily unavailable',
    description: 'This service is not responding right now. Try again in a moment.'
  }
};

export function ErrorState({ variant = 'error', title, description, onRetry }: ErrorStateProps) {
  const Icon = variant === 'unauthorized' ? LockIcon : AlertTriangleIcon;
  return (
    <div
      className="rounded-2xl border border-line bg-surface px-8 py-14 text-center"
      role="alert">
      
      <div className="mx-auto mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-clay-50 text-clay-600">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="font-serif text-xl text-ink">{title ?? copy[variant].title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">
        {description ?? copy[variant].description}
      </p>
      {onRetry ?
      <button
        type="button"
        onClick={onRetry}
        className="mt-6 rounded-lg border border-line bg-canvas px-4 py-2 text-sm font-medium text-ink transition-colors duration-150 ease-serene hover:bg-sage-50">
        
          Retry
        </button> :
      null}
    </div>);

}