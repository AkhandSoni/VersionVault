-- Keep uploaded originals and AI-readable extracted text explicitly separate.
-- versions/storage_objects remain the immutable original file record.
-- version_texts.text_content is the only document body AI/diff/blame should read.

ALTER TABLE public.version_texts
  ADD COLUMN IF NOT EXISTS original_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS content_mime_type TEXT NOT NULL DEFAULT 'text/plain; charset=utf-8';

UPDATE public.version_texts
SET original_mime_type = COALESCE(original_mime_type, mime_type),
    content_mime_type = COALESCE(NULLIF(content_mime_type, ''), 'text/plain; charset=utf-8');

ALTER TABLE public.version_texts
  ALTER COLUMN original_mime_type SET NOT NULL;
