-- Allow the private vault to preserve any valid document/media/archive format.
-- Application validation still enforces the 50 MB limit and rejects known
-- executable MIME categories. Text extraction remains format-dependent.
UPDATE storage.buckets
SET allowed_mime_types = NULL,
    file_size_limit = 52428800,
    public = false
WHERE id = 'documents';
