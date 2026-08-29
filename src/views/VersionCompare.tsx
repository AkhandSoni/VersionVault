import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, GitBranchIcon, ShieldCheckIcon } from 'lucide-react';
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
      </div>
    );
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
          description={`${parent.label} → ${version.label} produced no detected changes.`}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to={`/documents/${doc.id}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors duration-150 ease-serene hover:text-orange-600">
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {doc.title}
      </Link>

      <header className="mt-4 border-b border-line pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="label-eyebrow text-orange-800 font-semibold">Comparison</p>
          <span className="inline-flex items-center gap-1 font-mono text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <GitBranchIcon className="h-3 w-3" />
            {version.branch}
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
          {parent.label} → {version.label}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          <span className="font-semibold text-orange-700">
            {version.changes.filter((item) => item.material).length} material change
            {version.changes.filter((item) => item.material).length === 1 ? '' : 's'}
          </span>{' '}
          of {version.changes.length} detected
        </p>
      </header>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Detected changes">
        {version.changes.map((item, index) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={index === changeIndex}
            onClick={() => setChangeIndex(index)}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 ease-serene ${
              index === changeIndex
                ? 'border-orange-300 bg-orange-100 text-orange-950 shadow-xs'
                : 'border-line bg-surface text-ink-soft hover:bg-canvas hover:border-line/90'
            }`}>
            {item.section}
            {item.material && (
              <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-orange-500" />
            )}
          </button>
        ))}
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
            }}
          />
        </div>

        <div id="evidence" className="space-y-6">
          <EvidencePanel doc={doc} from={parent} to={version} change={change} />
        </div>
      </div>
    </div>
  );
}