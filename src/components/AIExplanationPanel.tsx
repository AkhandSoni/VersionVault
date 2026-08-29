import React from 'react';
import { SparklesIcon } from 'lucide-react';
import type { AIExplanation, AIStatus } from '../types';

interface AIExplanationPanelProps {
  status: AIStatus;
  explanation?: AIExplanation;
  onRetry?: () => void;
  onViewEvidence?: () => void;
}

const approvalCopy = {
  pending: 'Interpretation · approval pending',
  approved: 'Interpretation · reviewed by a person',
  rejected: 'Interpretation · rejected by a person'
};

export function AIExplanationPanel({
  status,
  explanation,
  onRetry,
  onViewEvidence
}: AIExplanationPanelProps) {
  return (
    <section
      aria-labelledby="ai-heading"
      data-testid="ai-explanation-panel"
      className="rounded-2xl border border-dashed border-line bg-canvas px-6 py-5">
      
      <div className="flex items-center gap-2">
        <SparklesIcon className="h-4 w-4 text-slate2-600" aria-hidden="true" />
        <h2 id="ai-heading" className="text-sm font-medium text-ink-soft">
          AI interpretation
        </h2>
        <span className="ml-auto text-xs text-ink-muted">Not a record of fact</span>
      </div>

      {status === 'processing' ?
      <p className="mt-4 text-sm text-ink-muted" role="status">
          Reading the change… the verified evidence above is already final.
        </p> :
      null}

      {status === 'failed' || status === 'unavailable' ?
      <div className="mt-4">
          <p className="text-sm leading-relaxed text-ink-soft">
            AI explanation unavailable. The deterministic changes and version history remain
            available above.
          </p>
          {onRetry ?
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink transition-colors duration-150 ease-serene hover:bg-sage-50">
          
              Retry
            </button> :
        null}
        </div> :
      null}

      {status === 'available' && explanation ?
      <div className="mt-4">
          <p className="text-sm font-medium text-ink">{explanation.question}</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{explanation.body}</p>

          <dl className="mt-5 grid gap-3 border-t border-line pt-4 sm:grid-cols-3">
            <div>
              <dt className="label-eyebrow">Based on</dt>
              <dd className="mt-0.5 text-sm text-ink">{explanation.basedOn}</dd>
            </div>
            <div>
              <dt className="label-eyebrow">Agent</dt>
              <dd className="mt-0.5 text-sm text-ink">{explanation.agent}</dd>
            </div>
            <div>
              <dt className="label-eyebrow">Model</dt>
              <dd className="mt-0.5 text-sm text-ink">{explanation.model}</dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <span className="text-xs text-ink-muted">{approvalCopy[explanation.approval]}</span>
            {onViewEvidence ?
          <button
            type="button"
            onClick={onViewEvidence}
            className="ml-auto rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink transition-colors duration-150 ease-serene hover:bg-sage-50">
            
                View evidence
              </button> :
          null}
          </div>
        </div> :
      null}
    </section>);

}