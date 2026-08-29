import React, { useEffect, useRef, useState } from 'react';
import { UploadCloudIcon } from 'lucide-react';
import type { UploadState } from '../types';

const statusCopy: Record<UploadState, string> = {
  idle: 'Drop a revision here, or choose a file.',
  selected: 'Ready to upload — nothing is recorded yet.',
  uploading: 'Uploading revision…',
  processing: 'Server is computing changes and hashes…',
  ready: 'Version recorded and confirmed by the server.',
  failed: 'Upload failed before any version was recorded.'
};

export function UploadZone() {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state !== 'uploading') return;
    const interval = window.setInterval(() => {
      setProgress((value) => {
        if (value >= 100) return 100;
        return value + 20;
      });
    }, 260);
    return () => window.clearInterval(interval);
  }, [state]);

  useEffect(() => {
    if (state === 'uploading' && progress >= 100) {
      const timeout = window.setTimeout(() => setState('processing'), 300);
      return () => window.clearTimeout(timeout);
    }
    if (state === 'processing') {
      const timeout = window.setTimeout(() => setState('ready'), 1400);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [state, progress]);

  function selectFile(name: string) {
    setFileName(name);
    setProgress(0);
    setState('selected');
  }

  return (
    <section
      aria-labelledby="upload-heading"
      data-testid="upload-zone"
      className="rounded-2xl border border-line bg-surface p-6">
      
      <h2 id="upload-heading" className="text-sm font-medium text-ink">
        Add a revision
      </h2>

      <div
        onDragOver={(event) => event.preventDefault()}
        onDrop={(event) => {
          event.preventDefault();
          const file = event.dataTransfer.files?.[0];
          if (file) selectFile(file.name);
        }}
        className="mt-4 flex flex-col items-center rounded-xl border border-dashed border-line bg-canvas px-6 py-8 text-center">
        
        <UploadCloudIcon className="h-5 w-5 text-sage-600" aria-hidden="true" />
        <p className="mt-3 text-sm text-ink-soft">{fileName ?? 'No file selected'}</p>
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
          }} />
        
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-line bg-surface px-3.5 py-2 text-sm text-ink transition-colors duration-150 ease-serene hover:bg-sage-50">
            
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
            className="rounded-lg bg-sage-600 px-3.5 py-2 text-sm font-medium text-white transition-colors duration-150 ease-serene hover:bg-sage-700 disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-muted">
            
            Upload revision
          </button>
        </div>
      </div>

      {state === 'uploading' ?
      <div className="mt-4" data-testid="upload-progress">
          <div className="h-1.5 overflow-hidden rounded-full bg-canvas">
            <div
            className="h-full rounded-full bg-sage-500 transition-[width] duration-200 ease-serene"
            style={{ width: `${progress}%` }} />
          
          </div>
          <p className="mt-2 text-xs text-ink-muted" role="status">
            {progress}% uploaded
          </p>
        </div> :
      null}

      {state === 'processing' ?
      <p className="mt-4 text-xs text-ink-muted" role="status">
          Processing — the version is not part of history until the server confirms it.
        </p> :
      null}

      {state === 'ready' ?
      <p className="mt-4 rounded-lg bg-sage-50 px-4 py-3 text-xs text-sage-700" role="status">
          Server confirmed V19 on main. SHA-256 recorded.
        </p> :
      null}

      {state === 'failed' ?
      <p className="mt-4 rounded-lg bg-clay-50 px-4 py-3 text-xs text-clay-700" data-testid="upload-error" role="alert">
          {statusCopy.failed}
        </p> :
      null}
    </section>);

}