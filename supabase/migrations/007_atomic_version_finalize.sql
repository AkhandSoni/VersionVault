-- ============================================================
-- Atomically finalize a version and advance its lineage pointers.
-- Storage upload happens before this call; the application must delete
-- the uploaded object if this transaction fails.
-- ============================================================

CREATE OR REPLACE FUNCTION public.finalize_version(
  p_version_id UUID,
  p_document_id UUID,
  p_tenant_id UUID,
  p_branch_id UUID,
  p_parent_version_id UUID,
  p_expected_head_version_id UUID,
  p_version_number INTEGER,
  p_content_hash TEXT,
  p_version_hash TEXT,
  p_storage_object_id UUID,
  p_storage_path TEXT,
  p_mime_type TEXT,
  p_file_size BIGINT,
  p_created_by TEXT,
  p_message TEXT DEFAULT NULL,
  p_restore_source_version_id UUID DEFAULT NULL
)
RETURNS public.versions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  document_tenant_id UUID;
  branch_row public.branches%ROWTYPE;
  parent_row public.versions%ROWTYPE;
  restore_row public.versions%ROWTYPE;
  version_row public.versions%ROWTYPE;
BEGIN
  SELECT d.tenant_id
    INTO document_tenant_id
    FROM public.documents d
   WHERE d.id = p_document_id;

  IF document_tenant_id IS NULL OR document_tenant_id IS DISTINCT FROM p_tenant_id THEN
    RAISE EXCEPTION 'VERSION_DOCUMENT_SCOPE_INVALID';
  END IF;

  IF NOT EXISTS (
    SELECT 1
      FROM public.memberships m
     WHERE m.tenant_id = p_tenant_id
       AND m.user_id::text = p_created_by
       AND m.role IN ('OWNER', 'CONTRIBUTOR')
  )
  AND NOT EXISTS (
    SELECT 1
      FROM public.collaborators c
     WHERE c.document_id = p_document_id
       AND c.user_id::text = p_created_by
       AND c.role IN ('OWNER', 'CONTRIBUTOR')
  ) THEN
    RAISE EXCEPTION 'VERSION_ACTOR_NOT_AUTHORIZED';
  END IF;

  SELECT *
    INTO branch_row
    FROM public.branches b
   WHERE b.id = p_branch_id
     AND b.document_id = p_document_id
     AND b.tenant_id = p_tenant_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'VERSION_BRANCH_SCOPE_INVALID';
  END IF;

  IF branch_row.status <> 'ACTIVE' THEN
    RAISE EXCEPTION 'VERSION_BRANCH_ARCHIVED';
  END IF;

  IF branch_row.head_version_id IS DISTINCT FROM p_expected_head_version_id THEN
    RAISE EXCEPTION 'VERSION_HEAD_CONFLICT';
  END IF;

  IF p_parent_version_id IS DISTINCT FROM branch_row.head_version_id THEN
    RAISE EXCEPTION 'VERSION_PARENT_HEAD_MISMATCH';
  END IF;

  IF p_parent_version_id IS NULL THEN
    IF p_version_number <> 1 THEN
      RAISE EXCEPTION 'VERSION_NUMBER_INVALID';
    END IF;
  ELSE
    SELECT *
      INTO parent_row
      FROM public.versions v
     WHERE v.id = p_parent_version_id
       AND v.document_id = p_document_id
     FOR SHARE;

    IF NOT FOUND OR parent_row.status <> 'READY' THEN
      RAISE EXCEPTION 'VERSION_PARENT_INVALID';
    END IF;

    IF p_version_number <> parent_row.version_number + 1 THEN
      RAISE EXCEPTION 'VERSION_NUMBER_INVALID';
    END IF;
  END IF;

  IF p_restore_source_version_id IS NOT NULL THEN
    SELECT *
      INTO restore_row
      FROM public.versions v
     WHERE v.id = p_restore_source_version_id
       AND v.document_id = p_document_id
     FOR SHARE;

    IF NOT FOUND OR restore_row.status <> 'READY' THEN
      RAISE EXCEPTION 'VERSION_RESTORE_SOURCE_INVALID';
    END IF;
  END IF;

  -- versions must exist before storage_objects because storage_objects.version_id
  -- has a foreign key to versions.id. The surrounding function transaction keeps
  -- both inserts atomic if either one fails.
  INSERT INTO public.versions (
    id,
    document_id,
    parent_version_id,
    branch_id,
    version_number,
    content_hash,
    version_hash,
    storage_object_id,
    mime_type,
    file_size,
    created_by,
    message,
    status,
    restore_source_version_id
  ) VALUES (
    p_version_id,
    p_document_id,
    p_parent_version_id,
    p_branch_id,
    p_version_number,
    p_content_hash,
    p_version_hash,
    p_storage_object_id::text,
    p_mime_type,
    p_file_size,
    p_created_by,
    p_message,
    'READY',
    p_restore_source_version_id
  )
  RETURNING * INTO version_row;

  INSERT INTO public.storage_objects (
    id,
    tenant_id,
    document_id,
    version_id,
    storage_path,
    mime_type,
    file_size,
    content_hash
  ) VALUES (
    p_storage_object_id,
    p_tenant_id,
    p_document_id,
    p_version_id,
    p_storage_path,
    p_mime_type,
    p_file_size,
    p_content_hash
  );

  UPDATE public.branches
     SET head_version_id = p_version_id
   WHERE id = p_branch_id;

  UPDATE public.documents
     SET current_version_id = p_version_id,
         updated_at = now()
   WHERE id = p_document_id;

  INSERT INTO public.activity_events (
    tenant_id,
    document_id,
    version_id,
    actor_id,
    actor_type,
    event_type,
    metadata
  ) VALUES (
    p_tenant_id,
    p_document_id,
    p_version_id,
    p_created_by,
    'human',
    'VERSION_CREATED',
    jsonb_build_object(
      'versionNumber', p_version_number,
      'contentHash', p_content_hash,
      'versionHash', p_version_hash,
      'fileSize', p_file_size,
      'message', p_message
    )
  );

  RETURN version_row;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.finalize_version(
  UUID, UUID, UUID, UUID, UUID, UUID, INTEGER, TEXT, TEXT, UUID, TEXT, TEXT, BIGINT, TEXT, TEXT, UUID
) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.finalize_version(
  UUID, UUID, UUID, UUID, UUID, UUID, INTEGER, TEXT, TEXT, UUID, TEXT, TEXT, BIGINT, TEXT, TEXT, UUID
) TO service_role;
