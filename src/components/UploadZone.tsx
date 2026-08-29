import React, { useRef, useState } from 'react';
import { UploadCloudIcon } from 'lucide-react';

type UploadState = 'idle' | 'selected' | 'uploading' | 'processing' | 'ready' | 'failed';

interface UploadZoneProps {
  onComplete?: () => void;
}

const statusCopy: Record<UploadState, string> = {
  idle: 'PDF, DOCX, TXT, or Markdown up to 50 MB.',
  selected: 'Ready to compute hash and upload.',
  uploading: 'Uploading bytes to private vault…',
  processing: 'Extracting text and computing deterministic diff…',
  ready: 'Version created. Immutability verified.',
  failed: 'Upload failed. The document state is untouched.',
};

export function UploadZone({ onComplete }: UploadZoneProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [filename, setFilename] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  function selectFile(name: string) {
    setFilename(name);
    setState('selected');
  }

  return (
    <section
      aria-labelledby="upload-heading"
      data-testid="upload-zone"
      className="rounded-2xl border border-line bg-surface p-6 shadow-xs sm:p-8">
      
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
          if (file) selectFile(file.name);
        }}
        className={`mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all duration-150 ease-serene ${
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

        <p className="mt-4 text-sm font-medium text-ink">
          {filename ? (
            <span className="font-mono text-orange-950 font-semibold">{filename}</span>
          ) : (
            'Drag your revised file here, or browse'
          )}
        </p>
        <p className="mt-1 text-xs text-ink-muted">{statusCopy[state]}</p>

        <input
          ref={inputRef}
          id="upload-input"
          data-testid="upload-input"
          type="file"
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) selectFile(file.name);
          }}
        />

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm font-medium text-ink transition-colors duration-150 ease-serene hover:bg-orange-50 hover:border-orange-200">
            Choose file
          </button>
          <button
            type="button"
            data-testid="upload-submit"
            disabled={state !== 'selected'}
            onClick={() => {
              setProgress(0);
              setState('uploading');
            }}
            className="rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 px-4 py-2 text-sm font-medium text-white shadow-xs transition-all duration-150 ease-serene hover:from-orange-500 hover:to-amber-500 disabled:cursor-not-allowed disabled:from-stone-200 disabled:to-stone-200 disabled:text-stone-500 disabled:shadow-none">
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
          Server confirmed V19 on main. SHA-256 recorded.
        </p>
      ) : null}

      {state === 'failed' ? (
        <p className="mt-4 rounded-lg bg-rose-50 border border-rose-200 px-4 py-3 text-xs font-medium text-rose-800" data-testid="upload-error" role="alert">
          {statusCopy.failed}
        </p>
      ) : null}
    </section>
  );
}