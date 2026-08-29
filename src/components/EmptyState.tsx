import React from 'react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-surface px-8 py-16 text-center">
      {icon ?
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-full bg-sage-50 text-sage-600">
          {icon}
        </div> :
      null}
      <h3 className="font-serif text-xl text-ink">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>);

}