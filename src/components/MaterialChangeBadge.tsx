import React from 'react';
import type { ChangeCategory, ChangeSeverity } from '../types';

interface MaterialChangeBadgeProps {
  category: ChangeCategory;
  severity: ChangeSeverity;
  material: boolean;
}

const severityLabel: Record<ChangeSeverity, string> = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const severityTone: Record<ChangeSeverity, string> = {
  high: 'bg-orange-100 text-orange-900 border-orange-300 font-semibold',
  medium: 'bg-amber-100 text-amber-900 border-amber-300 font-medium',
  low: 'bg-sage-100 text-sage-800 border-sage-200 font-medium',
};

export function MaterialChangeBadge({ category, severity, material }: MaterialChangeBadgeProps) {
  if (!material) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink-muted">
        Non-material · {category}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs shadow-xs ${severityTone[severity]}`}
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          severity === 'high' ? 'bg-orange-600 animate-pulse' : 'bg-current'
        }`}
      />
      Material change · {category} · {severityLabel[severity]}
    </span>
  );
}