-- ============================================================
-- Add extracted version text storage for deterministic diff/provenance.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.version_texts (
  version_id UUID PRIMARY KEY REFERENCES public.versions(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  original_mime_type TEXT NOT NULL DEFAULT 'application/octet-stream',
  content_mime_type TEXT NOT NULL DEFAULT 'text/plain; charset=utf-8',
  mime_type TEXT NOT NULL,
  text_content TEXT NOT NULL DEFAULT '',
  text_hash TEXT,
  extraction_status TEXT NOT NULL CHECK (extraction_status IN ('READY', 'UNSUPPORTED', 'FAILED')),
  extractor TEXT NOT NULL,
  warnings TEXT[] NOT NULL DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.version_texts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "version_texts_select" ON public.version_texts;
CREATE POLICY "version_texts_select" ON public.version_texts
  FOR SELECT USING (public.can_read_document(document_id));

DROP POLICY IF EXISTS "version_texts_insert" ON public.version_texts;
CREATE POLICY "version_texts_insert" ON public.version_texts
  FOR INSERT WITH CHECK (public.can_edit_document(document_id));

DROP POLICY IF EXISTS "version_texts_update" ON public.version_texts;
CREATE POLICY "version_texts_update" ON public.version_texts
  FOR UPDATE USING (public.can_edit_document(document_id));
