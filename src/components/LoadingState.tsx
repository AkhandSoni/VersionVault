import React from 'react';

interface LoadingStateProps {
  label?: string;
  rows?: number;
}

export function LoadingState({ label = 'Loading', rows = 3 }: LoadingStateProps) {
  return (
    <div
      className="rounded-2xl border border-line bg-surface p-6"
      role="status"
      aria-live="polite"
      aria-busy="true">
      
      <span className="sr-only">{label}</span>
      <div className="space-y-4">
        {Array.from({ length: rows }).map((_, index) =>
        <div key={index} className="flex items-center gap-4">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-canvas" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-2/5 animate-pulse rounded-full bg-canvas" />
              <div className="h-3 w-1/4 animate-pulse rounded-full bg-canvas" />
            </div>
          </div>
        )}
      </div>
    </div>);

}