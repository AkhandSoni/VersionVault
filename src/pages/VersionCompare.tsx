import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon } from 'lucide-react';
import { AIExplanationPanel } from '../components/AIExplanationPanel';
import { DiffViewer } from '../components/DiffViewer';
import { ErrorState } from '../components/ErrorState';
import { EvidencePanel } from '../components/EvidencePanel';
import { aiProposals } from '../data/documents';
import { explanationFor, getDocument, getParent, getVersion } from '../utils/documents';
import type { AIStatus } from '../types';

interface VersionCompareProps {
  aiStatus?: AIStatus;
}

export function VersionCompare({ aiStatus = 'available' }: VersionCompareProps) {
  const { documentId, versionId } = useParams();
  const doc = getDocument(documentId);
  const version = getVersion(doc, versionId);
  const parent = getParent(doc, version);
  const [changeIndex, setChangeIndex] = useState(0);
  const [status, setStatus] = useState<AIStatus>(aiStatus);

  if (!doc || !version || !parent) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState variant="unauthorized" />
      </div>);

  }

  const change = version.changes[changeIndex] ?? version.changes[0];
  const proposal = aiProposals.find(
    (item) => item.documentId === doc.id && item.section === change?.section
  );

  if (!change) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title="No structured changes to compare"
          description={`${parent.label} → ${version.label} produced no detected changes.`} />
        
      </div>);

  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to={`/documents/${doc.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors duration-150 ease-serene hover:text-ink">
        
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {doc.title}
      </Link>

      <header className="mt-4 border-b border-line pb-6">
        <p className="label-eyebrow">Comparison · {version.branch}</p>
        <h1 className="mt-1 font-serif text-3xl text-ink">
          {parent.label} → {version.label}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          {version.changes.filter((item) => item.material).length} material change
          {version.changes.filter((item) => item.material).length === 1 ? '' : 's'} of{' '}
          {version.changes.length} detected
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Detected changes">
        {version.changes.map((item, index) =>
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={index === changeIndex}
          onClick={() => setChangeIndex(index)}
          className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors duration-150 ease-serene ${
          index === changeIndex ?
          'border-sage-200 bg-sage-50 text-sage-700' :
          'border-line bg-surface text-ink-soft hover:bg-canvas'}`
          }>
          
            {item.section}
          </button>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <DiffViewer change={change} fromLabel={parent.label} toLabel={version.label} />
          <AIExplanationPanel
            status={explanationFor(change) ? status : 'unavailable'}
            explanation={explanationFor(change)}
            onRetry={() => setStatus('available')}
            onViewEvidence={() => {
              document.getElementById('evidence')?.scrollIntoView({ behavior: 'smooth' });
            }} />
          
        </div>

        <div id="evidence" className="space-y-6">
          <EvidencePanel doc={doc} from={parent} to={version} change={change} />

          <section
            aria-labelledby="provenance-heading"
            className="rounded-2xl border border-line bg-surface px-6 py-5">
            
            <h2 id="provenance-heading" className="text-sm font-medium text-ink">
              Provenance
            </h2>
            <dl className="mt-3 space-y-3 text-sm">
              <div>
                <dt className="label-eyebrow">Origin</dt>
                <dd className="mt-0.5 font-mono text-xs text-ink">{version.label}</dd>
              </div>
              <div>
                <dt className="label-eyebrow">Source</dt>
                <dd className="mt-0.5 text-ink">{version.source}</dd>
              </div>
              <div>
                <dt className="label-eyebrow">Parent</dt>
                <dd data-testid="version-parent" className="mt-0.5 font-mono text-xs text-ink">
                  {parent.label}
                </dd>
              </div>
            </dl>
          </section>

          {proposal ?
          <section
            aria-labelledby="proposal-heading"
            className="rounded-2xl border border-dashed border-wheat-100 bg-wheat-50 px-6 py-5">
            
              <h2 id="proposal-heading" className="text-sm font-medium text-wheat-600">
                AI proposed change · approval pending
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{proposal.proposed}</p>
              <p className="mt-2 text-xs text-ink-muted">{proposal.rationale}</p>
              <p className="mt-4 text-xs text-ink-muted">
                A proposal only becomes history after a person approves it and a new immutable
                version is created.
              </p>
              <div className="mt-4 flex gap-2">
                <button
                type="button"
                className="rounded-lg bg-sage-600 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 ease-serene hover:bg-sage-700">
                
                  Approve
                </button>
                <button
                type="button"
                className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink transition-colors duration-150 ease-serene hover:bg-canvas">
                
                  Reject
                </button>
              </div>
            </section> :
          null}
        </div>
      </div>
    </div>);

}