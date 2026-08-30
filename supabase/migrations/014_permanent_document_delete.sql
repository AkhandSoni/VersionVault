-- Permanently delete one document's complete version graph.
-- The application removes private storage objects first, then calls this
-- SECURITY DEFINER function for an atomic database cleanup.
CREATE OR REPLACE FUNCTION public.check_version_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only the SECURITY DEFINER purge function sets this transaction-local
  -- flag. Ordinary callers can never delete an immutable READY version.
  IF current_setting('versionvault.purge_document', true) = 'on' THEN
    IF TG_OP = 'DELETE' THEN
      RETURN OLD;
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'DELETE' THEN
    IF OLD.status = 'READY' THEN
      RAISE EXCEPTION 'CANNOT_DELETE_IMMUTABLE_VERSION: Version % is READY', OLD.id;
    END IF;
    RETURN OLD;
  END IF;

  IF OLD.status = 'READY' THEN
    IF OLD.content_hash IS DISTINCT FROM NEW.content_hash
      OR OLD.version_hash IS DISTINCT FROM NEW.version_hash
      OR OLD.parent_version_id IS DISTINCT FROM NEW.parent_version_id
      OR OLD.created_by IS DISTINCT FROM NEW.created_by
      OR OLD.created_at IS DISTINCT FROM NEW.created_at
      OR OLD.file_size IS DISTINCT FROM NEW.file_size
      OR OLD.storage_object_id IS DISTINCT FROM NEW.storage_object_id
      OR OLD.document_id IS DISTINCT FROM NEW.document_id
      OR OLD.branch_id IS DISTINCT FROM NEW.branch_id
      OR OLD.version_number IS DISTINCT FROM NEW.version_number
      OR OLD.mime_type IS DISTINCT FROM NEW.mime_type
      OR OLD.message IS DISTINCT FROM NEW.message
      OR OLD.status IS DISTINCT FROM NEW.status
      OR OLD.restore_source_version_id IS DISTINCT FROM NEW.restore_source_version_id THEN
      RAISE EXCEPTION 'CANNOT_MUTATE_IMMUTABLE_VERSION: Version % is READY', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.purge_document(
  p_document_id UUID,
  p_actor_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  document_tenant_id UUID;
  document_title TEXT;
  deleted_count INTEGER;
  pass_count INTEGER := 0;
BEGIN
  SELECT d.tenant_id, d.title
    INTO document_tenant_id, document_title
    FROM public.documents d
   WHERE d.id = p_document_id;

  IF document_tenant_id IS NULL THEN
    RAISE EXCEPTION 'DOCUMENT_NOT_FOUND';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
     WHERE m.tenant_id = document_tenant_id
       AND m.user_id = p_actor_id
       AND m.role = 'OWNER'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.documents d
     WHERE d.id = p_document_id
       AND d.created_by = p_actor_id
  ) THEN
    RAISE EXCEPTION 'DOCUMENT_PURGE_NOT_AUTHORIZED';
  END IF;

  PERFORM set_config('versionvault.purge_document', 'on', true);

  -- Keep the audit record after the document is gone by intentionally leaving
  -- document_id NULL. The tenant remains and owns the audit history.
  INSERT INTO public.activity_events (
    tenant_id, actor_id, actor_type, event_type, metadata
  ) VALUES (
    document_tenant_id,
    p_actor_id::TEXT,
    'human',
    'DOCUMENT_DELETED',
    jsonb_build_object('title', document_title, 'permanent', true, 'documentId', p_document_id)
  );

  -- This relationship is intentionally restrictive on resulting_version_id,
  -- so proposal records must be removed before their document's versions.
  DELETE FROM public.ai_proposals WHERE document_id = p_document_id;

  -- The parent_version_id foreign key is intentionally restrictive. Delete
  -- leaf versions repeatedly so every parent/child relationship is valid.
  -- Restored versions also reference their source version and must be treated
  -- as children for deletion ordering.
  -- Clear authoritative pointers first because the composite hardening
  -- constraints intentionally use NO ACTION for normal application writes.
  UPDATE public.documents
     SET current_version_id = NULL,
         default_branch_id = NULL
   WHERE id = p_document_id;
  UPDATE public.branches
     SET head_version_id = NULL,
         base_version_id = NULL
   WHERE document_id = p_document_id;

  LOOP
    DELETE FROM public.versions v
     WHERE v.document_id = p_document_id
       AND NOT EXISTS (
            SELECT 1 FROM public.versions child
            WHERE child.document_id = p_document_id
            AND (child.parent_version_id = v.id OR child.restore_source_version_id = v.id)
       );
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    EXIT WHEN deleted_count = 0;
    pass_count := pass_count + 1;
    IF pass_count > 10000 THEN
      RAISE EXCEPTION 'DOCUMENT_VERSION_GRAPH_INVALID';
    END IF;
  END LOOP;

  IF EXISTS (SELECT 1 FROM public.versions WHERE document_id = p_document_id) THEN
    RAISE EXCEPTION 'DOCUMENT_VERSION_GRAPH_INVALID';
  END IF;

  DELETE FROM public.branches WHERE document_id = p_document_id;
  DELETE FROM public.documents WHERE id = p_document_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_document(UUID, UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_document(UUID, UUID) TO service_role;
