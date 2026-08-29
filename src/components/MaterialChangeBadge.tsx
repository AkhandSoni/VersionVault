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
  low: 'Low'
};

const severityTone: Record<ChangeSeverity, string> = {
  high: 'bg-clay-50 text-clay-700 border-clay-100',
  medium: 'bg-wheat-50 text-wheat-600 border-wheat-100',
  low: 'bg-sage-50 text-sage-700 border-sage-100'
};

export function MaterialChangeBadge({ category, severity, material }: MaterialChangeBadgeProps) {
  if (!material) {
    return (
      <span className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-2.5 py-1 text-xs font-medium text-ink-muted">
        Non-material · {category}
      </span>);

  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${severityTone[severity]}`}>
      
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />
      Material change · {category} · {severityLabel[severity]}
    </span>);

}