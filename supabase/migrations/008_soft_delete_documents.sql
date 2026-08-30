-- Preserve immutable versions and audit history when a document is deleted.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS documents_active_tenant_idx
  ON public.documents (tenant_id, updated_at DESC)
  WHERE deleted_at IS NULL;
