-- ============================================================
-- Storage RLS for the private "documents" bucket.
-- Object path convention: {tenantId}/{documentId}/{versionId}/{objectId}
-- ============================================================

CREATE OR REPLACE FUNCTION public.storage_path_tenant_id(object_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN (storage.foldername(object_name))[1]::uuid;
EXCEPTION
  WHEN invalid_text_representation OR array_subscript_error THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.storage_path_document_id(object_name TEXT)
RETURNS UUID
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN (storage.foldername(object_name))[2]::uuid;
EXCEPTION
  WHEN invalid_text_representation OR array_subscript_error THEN
    RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_read_storage_object(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = public.storage_path_document_id(object_name)
      AND d.tenant_id = public.storage_path_tenant_id(object_name)
      AND public.can_read_document(d.id)
  );
$$;

CREATE OR REPLACE FUNCTION public.can_write_storage_object(object_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = public.storage_path_document_id(object_name)
      AND d.tenant_id = public.storage_path_tenant_id(object_name)
      AND public.can_edit_document(d.id)
  );
$$;

DROP POLICY IF EXISTS "documents_bucket_select" ON storage.objects;
CREATE POLICY "documents_bucket_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents'
    AND public.can_read_storage_object(name)
  );

DROP POLICY IF EXISTS "documents_bucket_insert" ON storage.objects;
CREATE POLICY "documents_bucket_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents'
    AND public.can_write_storage_object(name)
  );

DROP POLICY IF EXISTS "documents_bucket_update" ON storage.objects;
CREATE POLICY "documents_bucket_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'documents'
    AND public.can_write_storage_object(name)
  )
  WITH CHECK (
    bucket_id = 'documents'
    AND public.can_write_storage_object(name)
  );

DROP POLICY IF EXISTS "documents_bucket_delete" ON storage.objects;
CREATE POLICY "documents_bucket_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'documents'
    AND public.can_write_storage_object(name)
  );
