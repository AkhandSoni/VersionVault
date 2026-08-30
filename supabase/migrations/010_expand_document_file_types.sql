-- Keep the private document bucket aligned with the application upload contract.
-- Existing installations need this migration; changing 001 alone would not update
-- an already-created Supabase Storage bucket.

UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'documents';
