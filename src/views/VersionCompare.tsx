import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeftIcon, GitBranchIcon } from 'lucide-react';
import { AIExplanationPanel } from '../components/AIExplanationPanel';
import { DiffViewer } from '../components/DiffViewer';
import { ErrorState } from '../components/ErrorState';
import { EvidencePanel } from '../components/EvidencePanel';
import { LoadingState } from '../components/LoadingState';
import { useVaultData } from '../lib/vault-data';
import * as api from '../lib/api-client';
import { getDocument, getParent, getVersion } from '../utils/documents';
import type { AIExplanation, AIStatus } from '../types';

interface VersionCompareProps {
  aiStatus?: AIStatus;
}

function normalizeAIStatus(status: string | undefined): AIStatus {
  const normalized = status?.toLowerCase();
  if (normalized === 'available' || normalized === 'processing' || normalized === 'failed') {
    return normalized;
  }
  return 'unavailable';
}

export function VersionCompare({ aiStatus = 'available' }: VersionCompareProps) {
  const { documentId, versionId } = useParams();
  const { documents, loading, error, refresh } = useVaultData();
  const doc = getDocument(documents, documentId);
  const version = getVersion(doc, versionId);
  const parent = getParent(doc, version);
  const [changeSelection, setChangeSelection] = useState({ versionId: '', index: 0 });
  const [aiState, setAIState] = useState<{ key: string; status: AIStatus; explanation?: AIExplanation }>({
    key: '',
    status: normalizeAIStatus(aiStatus),
  });

  const changeIndex = changeSelection.versionId === version?.id ? changeSelection.index : 0;
  const change = version?.changes[changeIndex] ?? version?.changes[0];
  const explanationKey = parent && version && change ? `${parent.id}:${version.id}:${change.id}` : '';
  const status = explanationKey && aiState.key !== explanationKey ? 'processing' : aiState.status;
  const explanation = aiState.key === explanationKey ? aiState.explanation : undefined;

  useEffect(() => {
    if (!parent || !version || !change) return;
    let alive = true;

    api.getExplanation(parent.id, version.id)
      .then((result) => {
        if (!alive) return;
        const nextStatus = normalizeAIStatus(result.status);
        setAIState({
          key: explanationKey,
          status: nextStatus,
          explanation: nextStatus === 'available'
            ? api.mapExplanation(result, change.id, parent.label, version.label)
            : undefined,
        });
      })
      .catch(() => {
        if (!alive) return;
        setAIState({ key: explanationKey, status: 'failed' });
      });

    return () => {
      alive = false;
    };
  }, [change, explanationKey, parent, version]);

  if (loading) {
    return <LoadingState label="Loading comparison" rows={4} />;
  }

  if (error) {
    return <ErrorState variant="unavailable" description={error} onRetry={() => void refresh()} />;
  }

  if (!doc || !version || !parent) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState variant="unauthorized" />
      </div>
    );
  }

  if (!change) {
    return (
      <div className="mx-auto max-w-2xl">
        <ErrorState
          title="No structured changes to compare"
          description={`${parent.label} to ${version.label} produced no detected changes.`}
        />
      </div>
    );
  }

  const materialCount = version.changes.filter((item) => item.material).length;

  return (
    <div className="mx-auto max-w-6xl" data-testid="page-version-compare">
      <Link
        to={`/documents/${doc.id}?branch=${encodeURIComponent(version.branch)}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-muted transition-colors duration-150 ease-serene hover:text-orange-600">
        <ArrowLeftIcon className="h-4 w-4" aria-hidden="true" />
        {doc.title}
      </Link>

      <header className="mt-4 border-b border-line pb-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="label-eyebrow text-orange-800 font-semibold">Comparison</p>
          <span className="inline-flex items-center gap-1 rounded border border-amber-200 bg-amber-50 px-2 py-0.5 font-mono text-xs text-amber-800">
            <GitBranchIcon className="h-3 w-3" />
            {version.branch}
          </span>
        </div>
        <h1 className="mt-1 font-serif text-3xl font-semibold text-ink">
          {parent.label} to {version.label}
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          <span className="font-semibold text-orange-700">
            {materialCount} material change{materialCount === 1 ? '' : 's'}
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
            onClick={() => setChangeSelection({ versionId: version.id, index })}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all duration-150 ease-serene ${
              index === changeIndex
                ? 'border-orange-300 bg-orange-100 text-orange-950 shadow-xs'
                : 'border-line bg-surface text-ink-soft hover:bg-canvas hover:border-line/90'
            }`}>
            {item.section}
            {item.material ? <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-orange-500" /> : null}
          </button>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <DiffViewer change={change} fromLabel={parent.label} toLabel={version.label} />
          <AIExplanationPanel
            status={explanation ? status : status === 'available' ? 'unavailable' : status}
            explanation={explanation}
            onRetry={() => {
              setAIState({ key: explanationKey, status: 'processing' });
              void api.getExplanation(parent.id, version.id).then((result) => {
                const nextStatus = normalizeAIStatus(result.status);
                setAIState({
                  key: explanationKey,
                  status: nextStatus,
                  explanation: nextStatus === 'available'
                    ? api.mapExplanation(result, change.id, parent.label, version.label)
                    : undefined,
                });
              }).catch(() => setAIState({ key: explanationKey, status: 'failed' }));
            }}
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
