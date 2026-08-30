-- ============================================================
-- VersionVault integrity and RLS hardening.
--
-- This migration is intentionally additive. It closes relationship,
-- audit, and READY-version mutation gaps while keeping existing data
-- available for an explicit cleanup/validation pass.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Make tenant/document/branch/version relationships explicit.
-- ------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS documents_id_tenant_uidx
  ON public.documents (id, tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS branches_id_document_tenant_uidx
  ON public.branches (id, document_id, tenant_id);

CREATE UNIQUE INDEX IF NOT EXISTS branches_id_document_uidx
  ON public.branches (id, document_id);

CREATE UNIQUE INDEX IF NOT EXISTS versions_id_document_uidx
  ON public.versions (id, document_id);

CREATE UNIQUE INDEX IF NOT EXISTS storage_objects_version_uidx
  ON public.storage_objects (version_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_branches_document_tenant'
  ) THEN
    ALTER TABLE public.branches
      ADD CONSTRAINT fk_branches_document_tenant
      FOREIGN KEY (document_id, tenant_id)
      REFERENCES public.documents(id, tenant_id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_versions_branch_document'
  ) THEN
    ALTER TABLE public.versions
      ADD CONSTRAINT fk_versions_branch_document
      FOREIGN KEY (branch_id, document_id)
      REFERENCES public.branches(id, document_id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_versions_parent_document'
  ) THEN
    ALTER TABLE public.versions
      ADD CONSTRAINT fk_versions_parent_document
      FOREIGN KEY (parent_version_id, document_id)
      REFERENCES public.versions(id, document_id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_branches_head_document'
  ) THEN
    ALTER TABLE public.branches
      ADD CONSTRAINT fk_branches_head_document
      FOREIGN KEY (head_version_id, document_id)
      REFERENCES public.versions(id, document_id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_branches_base_document'
  ) THEN
    ALTER TABLE public.branches
      ADD CONSTRAINT fk_branches_base_document
      FOREIGN KEY (base_version_id, document_id)
      REFERENCES public.versions(id, document_id)
      NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_current_document'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT fk_documents_current_document
      FOREIGN KEY (current_version_id, id)
      REFERENCES public.versions(id, document_id)
      NOT VALID;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 2. Restrict audit writes and constrain event vocabulary.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "activity_events_insert" ON public.activity_events;
CREATE POLICY "activity_events_insert" ON public.activity_events
  FOR INSERT WITH CHECK (
    public.is_tenant_member(tenant_id)
    AND actor_type = 'human'
    AND actor_id = auth.uid()::text
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'activity_events_event_type_check'
  ) THEN
    ALTER TABLE public.activity_events
      ADD CONSTRAINT activity_events_event_type_check
      CHECK (event_type IN (
        'DOCUMENT_CREATED',
        'DOCUMENT_DELETED',
        'VERSION_CREATED',
        'VERSION_READY',
        'VERSION_FAILED',
        'CHANGE_DETECTED',
        'BRANCH_CREATED',
        'AI_PROPOSAL_CREATED',
        'AI_PROPOSAL_APPROVED',
        'AI_PROPOSAL_REJECTED',
        'HUMAN_APPROVAL_RECORDED',
        'VERSION_RESTORED',
        'PERMISSION_CHANGED',
        'DOCUMENT_DOWNLOADED'
      )) NOT VALID;
  END IF;
END $$;

-- Preserve audit history if a tenant is removed; deletion must be an
-- explicit retention operation rather than an accidental cascade.
ALTER TABLE public.activity_events
  DROP CONSTRAINT IF EXISTS activity_events_tenant_id_fkey;

ALTER TABLE public.activity_events
  ADD CONSTRAINT activity_events_tenant_id_fkey
  FOREIGN KEY (tenant_id)
  REFERENCES public.tenants(id)
  ON DELETE RESTRICT;

-- ------------------------------------------------------------
-- 3. Scope direct RLS policies to document access, not only tenancy.
-- ------------------------------------------------------------
DROP POLICY IF EXISTS "branches_select" ON public.branches;
CREATE POLICY "branches_select" ON public.branches
  FOR SELECT USING (public.can_read_document(document_id));

DROP POLICY IF EXISTS "branches_insert" ON public.branches;
CREATE POLICY "branches_insert" ON public.branches
  FOR INSERT WITH CHECK (public.can_edit_document(document_id));

DROP POLICY IF EXISTS "branches_update" ON public.branches;
CREATE POLICY "branches_update" ON public.branches
  FOR UPDATE USING (public.can_edit_document(document_id));

DROP POLICY IF EXISTS "storage_objects_select" ON public.storage_objects;
CREATE POLICY "storage_objects_select" ON public.storage_objects
  FOR SELECT USING (public.can_read_document(document_id));

DROP POLICY IF EXISTS "storage_objects_insert" ON public.storage_objects;
CREATE POLICY "storage_objects_insert" ON public.storage_objects
  FOR INSERT WITH CHECK (public.can_edit_document(document_id));

DROP POLICY IF EXISTS "storage_objects_delete" ON public.storage_objects;
CREATE POLICY "storage_objects_delete" ON public.storage_objects
  FOR DELETE USING (public.can_edit_document(document_id));

-- ------------------------------------------------------------
-- 4. Enforce the READY immutability contract, including deletion.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION check_version_immutability()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_version_immutability ON public.versions;
CREATE TRIGGER tr_version_immutability
  BEFORE UPDATE OR DELETE ON public.versions
  FOR EACH ROW
  EXECUTE FUNCTION check_version_immutability();
