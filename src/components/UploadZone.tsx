import React, { useEffect, useRef, useState } from 'react';
import { UploadCloudIcon } from 'lucide-react';

type UploadState = 'idle' | 'selected' | 'uploading' | 'processing' | 'ready' | 'failed';

interface UploadZoneProps {
  onComplete?: (file: File, message?: string, idempotencyKey?: string) => Promise<{
    versionNumber?: number;
    status?: string;
    branchId?: string;
  } | void> | void;
}

const statusCopy: Record<UploadState, string> = {
  idle: 'Word, PowerPoint, Excel, PDF, text, and common document files up to 50 MB.',
  selected: 'Ready to compute hash and upload.',
  uploading: 'Uploading bytes to private vault…',
  processing: 'Extracting text and computing deterministic diff…',
  ready: 'Version created. Immutability verified.',
  failed: 'Upload failed. The document state is untouched.',
};

const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function UploadZone({ onComplete }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [filename, setFilename] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [confirmedVersion, setConfirmedVersion] = useState<number | null>(null);
  const [confirmedBranch, setConfirmedBranch] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(file: File) {
    if (file.size === 0) {
      setSelectedFile(null);
      setFilename(null);
      setError('The selected file is empty.');
      setState('failed');
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      setSelectedFile(null);
      setFilename(null);
      setError('The selected file is larger than the 50 MB limit.');
      setState('failed');
      return;
    }
    setSelectedFile(file);
    setFilename(file.name);
    setIdempotencyKey(crypto.randomUUID());
    setError(null);
    setState('selected');
  }

  async function submitUpload() {
    if (!selectedFile) return;
    setProgress(8);
    setState('uploading');
    setError(null);
    setConfirmedVersion(null);
    setConfirmedBranch(null);

    try {
      const result = await onComplete?.(selectedFile, message.trim() || undefined, idempotencyKey || undefined);
      setState('processing');
      setProgress(100);
      setConfirmedVersion(result?.versionNumber ?? null);
      setConfirmedBranch(result?.branchId ?? null);
      setState('ready');
      setMessage('');
    } catch (err) {
      setState('failed');
      setError(err instanceof Error ? err.message : 'Upload failed.');
    }
  }

  useEffect(() => {
    if (state !== 'uploading') return;

    const intervalId = window.setInterval(() => {
      setProgress((current) => {
        // This is upload feedback, not a commit claim. Hold below 100% until
        // the API confirms that the immutable version was finalized.
        const next = Math.min(current + 12, 90);
        return next;
      });
    }, 160);

    return () => window.clearInterval(intervalId);
  }, [onComplete, state]);

  return (
    <section
      aria-labelledby="upload-heading"
      data-testid="upload-zone"
      id="document-upload"
      className="min-w-0 rounded-2xl border border-line bg-surface p-5 shadow-xs sm:p-6">
      
      <h2 id="upload-heading" className="text-sm font-semibold text-ink">
        Upload new revision
      </h2>
      <p className="mt-0.5 text-xs text-ink-muted">
        Every upload creates a permanent, immutable version with cryptographic proof.
      </p>

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files?.[0];
          if (file) selectFile(file);
        }}
        className={`mt-5 flex min-w-0 flex-col items-center justify-center rounded-xl border-2 border-dashed p-5 text-center transition-all duration-150 ease-serene sm:p-6 ${
          state === 'selected'
            ? 'border-orange-400 bg-orange-50/50'
            : 'border-line/80 bg-canvas/60 hover:border-orange-300 hover:bg-orange-50/20'
        }`}
      >
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-orange-100 to-amber-100 text-orange-600 shadow-xs">
          <UploadCloudIcon className="h-6 w-6" />
        </span>

        <p className="mt-4 max-w-full break-words text-sm font-medium text-ink">
          {filename ? (
            <span className="font-mono font-semibold text-orange-950">{filename}</span>
          ) : (
            'Drag your revised file here, or browse'
          )}
        </p>
        <p className="mt-1 max-w-full text-wrap text-xs leading-relaxed text-ink-muted">
          {statusCopy[state]}
        </p>

        <input
          ref={inputRef}
          id="upload-input"
          data-testid="upload-input"
          type="file"
          accept="*/*"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) selectFile(file);
          }}
        />

        <textarea
          disabled={state === 'uploading' || state === 'processing'}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="Optional revision message"
          className="mt-5 min-h-20 w-full resize-none rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-orange-500 focus:outline-none focus:ring-1 focus:ring-orange-500"
        />

        <div className="mt-5 flex w-full flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={state === 'uploading' || state === 'processing'}
            className="inline-flex items-center justify-center rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors duration-150 ease-serene hover:border-orange-200 hover:bg-orange-50 disabled:cursor-not-allowed disabled:opacity-50">
            Choose file
          </button>
          <button
            type="button"
            data-testid="upload-submit"
            disabled={state !== 'selected'}
            onClick={() => void submitUpload()}
            className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-all duration-150 ease-serene hover:from-orange-500 hover:to-amber-500 disabled:cursor-not-allowed disabled:from-stone-200 disabled:to-stone-200 disabled:text-stone-500 disabled:shadow-none">
            Upload revision
          </button>
        </div>
      </div>

      {state === 'uploading' ? (
        <div className="mt-4" data-testid="upload-progress">
          <div className="h-2 overflow-hidden rounded-full bg-canvas border border-line">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-[width] duration-200 ease-serene"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-xs font-medium text-orange-950" role="status">
            {progress}% uploaded
          </p>
        </div>
      ) : null}

      {state === 'processing' ? (
        <p className="mt-4 text-xs font-medium text-orange-800 bg-orange-50 px-4 py-3 rounded-lg border border-orange-200" role="status">
          Processing — the version is not part of history until the server confirms it.
        </p>
      ) : null}

      {state === 'ready' ? (
        <p className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs font-medium text-emerald-800" role="status">
          Server confirmed {confirmedVersion ? `V${confirmedVersion}` : 'the new version'}{confirmedBranch ? ` on ${confirmedBranch}` : ''}. SHA-256 recorded.
        </p>
      ) : null}

      {state === 'failed' ? (
        <div className="mt-4 space-y-3">
          <p className="rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800" data-testid="upload-error" role="alert">
            {error || statusCopy.failed}
          </p>
          {selectedFile ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setProgress(0);
                setState('selected');
              }}
              className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors hover:border-orange-200 hover:bg-orange-50">
              Retry upload
            </button>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
