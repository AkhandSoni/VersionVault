import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-8 py-16 text-center shadow-xs">
      {icon ? (
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-orange-100 to-amber-100 text-orange-600 border border-orange-200 shadow-xs">
          {icon}
        </div>
      ) : null}
      <h3 className="font-serif text-xl font-semibold text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}