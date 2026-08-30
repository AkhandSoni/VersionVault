import React, { useState } from 'react';
import { BotIcon, CheckCircle2Icon, XCircleIcon, AlertTriangleIcon, SparklesIcon } from 'lucide-react';
import type { AIProposal } from '../types';

interface AIProposalCardProps {
  proposal: AIProposal;
  onApprove?: (proposalId: string) => void;
  onReject?: (proposalId: string) => void;
}

export function AIProposalCard({ proposal, onApprove, onReject }: AIProposalCardProps) {
  const [status, setStatus] = useState<string>(proposal.approval.toUpperCase());
  const [feedback, setFeedback] = useState<string | null>(null);

  function handleApprove() {
    setStatus('APPROVED');
    setFeedback('AI Proposal approved. A new immutable version has been recorded on branch head.');
    onApprove?.(proposal.id);
  }

  function handleReject() {
    setStatus('REJECTED');
    setFeedback('AI Proposal rejected. Document history remains untouched.');
    onReject?.(proposal.id);
  }

  return (
    <section
      aria-labelledby="proposal-heading"
      className="rounded-2xl border-2 border-orange-300/80 bg-gradient-to-br from-orange-50/40 via-surface to-amber-50/30 p-6 shadow-sm">
      
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-orange-200/60 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-orange-600 to-amber-500 text-white shadow-xs">
            <BotIcon className="h-4 w-4" />
          </span>
          <div>
            <h2 id="proposal-heading" className="text-sm font-semibold text-ink">
              AI Proposed Modification · {proposal.section}
            </h2>
            <p className="text-xs text-ink-muted">
              Branch: <span className="font-mono text-orange-950 font-medium">{proposal.branch}</span>
            </p>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
            status === 'APPROVED'
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : status === 'REJECTED'
              ? 'bg-rose-100 text-rose-800 border border-rose-300'
              : 'bg-orange-100 text-orange-900 border border-orange-300 animate-pulse'
          }`}
        >
          {status === 'APPROVED' && <CheckCircle2Icon className="h-3 w-3" />}
          {status === 'REJECTED' && <XCircleIcon className="h-3 w-3" />}
          {status === 'PENDING' && <SparklesIcon className="h-3 w-3" />}
          {status}
        </span>
      </div>

      <div className="mt-4 space-y-3">
        <div>
          <p className="label-eyebrow text-orange-900">Rationale</p>
          <p className="mt-1 text-sm leading-relaxed text-ink font-medium">
            {proposal.rationale || 'Suggested clause clarification based on market standards.'}
          </p>
        </div>

        <div>
          <p className="label-eyebrow text-orange-900">Proposed Content</p>
          <div className="mt-1 rounded-xl border border-orange-200 bg-surface/90 p-4 font-mono text-xs text-ink shadow-xs">
            {proposal.proposed}
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-muted pt-1">
          <AlertTriangleIcon className="h-3.5 w-3.5 text-amber-600" />
          <span>Human approval required before this proposal enters authoritative version history.</span>
        </div>
      </div>

      {feedback && (
        <p className="mt-4 rounded-lg bg-orange-100 border border-orange-200 px-4 py-2.5 text-xs font-medium text-orange-950">
          {feedback}
        </p>
      )}

      {status === 'PENDING' && (
        <div className="mt-5 flex flex-wrap justify-end gap-2.5 pt-3 border-t border-orange-200/60">
          <button
            type="button"
            onClick={handleReject}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-rose-700 transition-colors hover:bg-rose-50 hover:border-rose-200">
            <XCircleIcon className="h-4 w-4" />
            Reject
          </button>
          <button
            type="button"
            onClick={handleApprove}
            className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-all hover:from-orange-500 hover:to-amber-500">
            <CheckCircle2Icon className="h-4 w-4" />
            Approve & Create Version
          </button>
        </div>
      )}
    </section>
  );
}
