-- VersionVault combined Supabase schema
--
-- Run this file in a fresh Supabase project or run only the unapplied
-- migration sections against an existing project.
-- Migrations are intentionally preserved in filename order.
--
BEGIN;

-- ============================================================================
-- 001_initial_schema.sql
-- ============================================================================

-- ============================================================
-- VersionVault â€” Complete Relational Database Schema & Migrations
-- Target Database: PostgreSQL 15+ (Supabase)
-- Source of Truth: PRD.md Â§12, SECURITY.md, TECH_LEAD_SERVICES.md
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. TENANTS & MEMBERSHIPS (Multi-tenancy isolation)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'CONTRIBUTOR', 'VIEWER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);

-- ============================================================
-- 2. BRANCHES (Pre-declaration for foreign keys)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  head_version_id UUID,
  base_version_id UUID,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, name)
);

-- ============================================================
-- 3. DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  current_version_id UUID,
  default_branch_id UUID,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. VERSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  parent_version_id UUID REFERENCES public.versions(id),
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  version_hash TEXT,
  storage_object_id TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  created_by TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'UPLOADING' CHECK (status IN ('UPLOADING', 'PROCESSING', 'READY', 'FAILED')),
  restore_source_version_id UUID REFERENCES public.versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, branch_id, version_number)
);

-- ------------------------------------------------------------
-- Idempotent Foreign Key Constraints for Circular References
-- ------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_current_version'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT fk_documents_current_version
      FOREIGN KEY (current_version_id) REFERENCES public.versions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_documents_default_branch'
  ) THEN
    ALTER TABLE public.documents
      ADD CONSTRAINT fk_documents_default_branch
      FOREIGN KEY (default_branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_branches_head_version'
  ) THEN
    ALTER TABLE public.branches
      ADD CONSTRAINT fk_branches_head_version
      FOREIGN KEY (head_version_id) REFERENCES public.versions(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_branches_base_version'
  ) THEN
    ALTER TABLE public.branches
      ADD CONSTRAINT fk_branches_base_version
      FOREIGN KEY (base_version_id) REFERENCES public.versions(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- 5. COLLABORATORS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'CONTRIBUTOR', 'VIEWER')),
  added_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, user_id)
);

-- ============================================================
-- 6. STORAGE OBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.storage_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  content_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 7. VERSION TEXTS
-- Extracted normalized text used by deterministic diff/provenance.
-- Original files remain in private storage_objects.
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

-- ============================================================
-- 8. STRUCTURED CHANGES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.structured_changes (
  id TEXT PRIMARY KEY,
  base_version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  target_version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('ADDED', 'REMOVED', 'MODIFIED', 'MOVED')),
  section TEXT,
  old_value TEXT,
  new_value TEXT,
  category TEXT CHECK (category IN ('FINANCIAL', 'CONTRACTUAL', 'OPERATIONAL', 'TECHNICAL', 'CONTENT', 'GENERAL')),
  severity TEXT CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
  confidence NUMERIC(4, 2),
  location JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. PROCESSING JOBS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.processing_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'RUNNING', 'COMPLETED', 'FAILED')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- ============================================================
-- 10. ACTIVITY EVENTS (Append-only Audit Log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  version_id UUID REFERENCES public.versions(id) ON DELETE SET NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'user', 'ai_agent')),
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 11. AI EXPLANATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_explanations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  target_version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  explanation TEXT NOT NULL,
  affected_areas TEXT[] DEFAULT '{}',
  status TEXT NOT NULL CHECK (status IN ('AVAILABLE', 'PROCESSING', 'UNAVAILABLE', 'FAILED')),
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. AI PROPOSALS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ai_proposals (
  id TEXT PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  source_version_id UUID NOT NULL REFERENCES public.versions(id) ON DELETE CASCADE,
  agent_id TEXT,
  task_description TEXT,
  proposed_content TEXT NOT NULL,
  rationale TEXT,
  actor_type TEXT DEFAULT 'ai_agent',
  actor_id TEXT,
  model TEXT,
  task_id TEXT,
  approval_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejected_by UUID REFERENCES auth.users(id),
  rejected_at TIMESTAMPTZ,
  resulting_version_id UUID REFERENCES public.versions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INTEGRITY & IMMUTABILITY TRIGGERS
-- ============================================================

-- A. Prevent mutation of READY versions
CREATE OR REPLACE FUNCTION check_version_immutability()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'READY' THEN
    IF (OLD.content_hash IS DISTINCT FROM NEW.content_hash OR
        OLD.parent_version_id IS DISTINCT FROM NEW.parent_version_id OR
        OLD.created_by IS DISTINCT FROM NEW.created_by OR
        OLD.file_size IS DISTINCT FROM NEW.file_size OR
        OLD.storage_object_id IS DISTINCT FROM NEW.storage_object_id OR
        OLD.document_id IS DISTINCT FROM NEW.document_id OR
        OLD.branch_id IS DISTINCT FROM NEW.branch_id OR
        OLD.version_number IS DISTINCT FROM NEW.version_number) THEN
      RAISE EXCEPTION 'CANNOT_MUTATE_IMMUTABLE_VERSION: Version % is READY and cannot be altered', OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_version_immutability ON public.versions;
CREATE TRIGGER tr_version_immutability
  BEFORE UPDATE ON public.versions
  FOR EACH ROW
  EXECUTE FUNCTION check_version_immutability();

-- B. Prevent mutation or deletion of Activity Audit Logs
CREATE OR REPLACE FUNCTION check_activity_events_append_only()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.tenant_id IS NOT DISTINCT FROM NEW.tenant_id
      AND OLD.actor_id IS NOT DISTINCT FROM NEW.actor_id
      AND OLD.actor_type IS NOT DISTINCT FROM NEW.actor_type
      AND OLD.event_type IS NOT DISTINCT FROM NEW.event_type
      AND OLD.metadata IS NOT DISTINCT FROM NEW.metadata
      AND OLD.created_at IS NOT DISTINCT FROM NEW.created_at
      AND (OLD.document_id IS NOT DISTINCT FROM NEW.document_id OR NEW.document_id IS NULL)
      AND (OLD.version_id IS NOT DISTINCT FROM NEW.version_id OR NEW.version_id IS NULL) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'CANNOT_UPDATE_AUDIT_LOG: activity_events is strictly append-only';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'CANNOT_DELETE_AUDIT_LOG: activity_events records cannot be deleted';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_activity_append_only ON public.activity_events;
CREATE TRIGGER tr_activity_append_only
  BEFORE UPDATE OR DELETE ON public.activity_events
  FOR EACH ROW
  EXECUTE FUNCTION check_activity_events_append_only();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.version_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.structured_changes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_explanations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_proposals ENABLE ROW LEVEL SECURITY;

-- Helper function: check if user is a member of a tenant
CREATE OR REPLACE FUNCTION public.is_tenant_member(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE tenant_id = target_tenant_id
      AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: check if user is an owner or contributor of a tenant
CREATE OR REPLACE FUNCTION public.can_edit_tenant(target_tenant_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.memberships
    WHERE tenant_id = target_tenant_id
      AND user_id = auth.uid()
      AND role IN ('OWNER', 'CONTRIBUTOR')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_document_collaborator(target_document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collaborators c
    WHERE c.document_id = target_document_id
      AND c.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_document(target_document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = target_document_id
      AND (
        public.can_edit_tenant(d.tenant_id)
        OR EXISTS (
          SELECT 1
          FROM public.collaborators c
          WHERE c.document_id = d.id
            AND c.user_id = auth.uid()
            AND c.role IN ('OWNER', 'CONTRIBUTOR')
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_document(target_document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = target_document_id
      AND (
        public.is_tenant_member(d.tenant_id)
        OR public.is_document_collaborator(d.id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_document(target_document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = target_document_id
      AND (
        d.created_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.memberships m
          WHERE m.tenant_id = d.tenant_id
            AND m.user_id = auth.uid()
            AND m.role = 'OWNER'
        )
        OR EXISTS (
          SELECT 1
          FROM public.collaborators c
          WHERE c.document_id = d.id
            AND c.user_id = auth.uid()
            AND c.role = 'OWNER'
        )
      )
  );
$$;

-- 1. Tenants Policies
DROP POLICY IF EXISTS "tenants_select_membership" ON public.tenants;
CREATE POLICY "tenants_select_membership" ON public.tenants
  FOR SELECT USING (public.is_tenant_member(id));

DROP POLICY IF EXISTS "tenants_insert_authenticated" ON public.tenants;
CREATE POLICY "tenants_insert_authenticated" ON public.tenants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "tenants_update_owner" ON public.tenants;
CREATE POLICY "tenants_update_owner" ON public.tenants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = id AND user_id = auth.uid() AND role = 'OWNER'
    )
  );

-- 2. Memberships Policies
DROP POLICY IF EXISTS "memberships_select_tenant" ON public.memberships;
CREATE POLICY "memberships_select_tenant" ON public.memberships
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "memberships_insert_owner" ON public.memberships;
CREATE POLICY "memberships_insert_owner" ON public.memberships
  FOR INSERT WITH CHECK (
    auth.role() = 'authenticated' AND (
      user_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM public.memberships
        WHERE tenant_id = memberships.tenant_id AND user_id = auth.uid() AND role = 'OWNER'
      )
    )
  );

DROP POLICY IF EXISTS "memberships_update_owner" ON public.memberships;
CREATE POLICY "memberships_update_owner" ON public.memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = memberships.tenant_id AND user_id = auth.uid() AND role = 'OWNER'
    )
  );

DROP POLICY IF EXISTS "memberships_delete_owner" ON public.memberships;
CREATE POLICY "memberships_delete_owner" ON public.memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = memberships.tenant_id AND user_id = auth.uid() AND role = 'OWNER'
    )
  );

-- 3. Documents Policies
DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (
    public.is_tenant_member(tenant_id) OR
    public.is_document_collaborator(id)
  );

DROP POLICY IF EXISTS "documents_insert" ON public.documents;
CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (
    public.can_edit_tenant(tenant_id) AND created_by = auth.uid()
  );

DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (public.can_edit_document(id));

-- 4. Branches Policies
DROP POLICY IF EXISTS "branches_select" ON public.branches;
CREATE POLICY "branches_select" ON public.branches
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "branches_insert" ON public.branches;
CREATE POLICY "branches_insert" ON public.branches
  FOR INSERT WITH CHECK (public.can_edit_tenant(tenant_id));

DROP POLICY IF EXISTS "branches_update" ON public.branches;
CREATE POLICY "branches_update" ON public.branches
  FOR UPDATE USING (public.can_edit_tenant(tenant_id));

-- 5. Versions Policies
DROP POLICY IF EXISTS "versions_select" ON public.versions;
CREATE POLICY "versions_select" ON public.versions
  FOR SELECT USING (public.can_read_document(document_id));

DROP POLICY IF EXISTS "versions_insert" ON public.versions;
CREATE POLICY "versions_insert" ON public.versions
  FOR INSERT WITH CHECK (public.can_edit_document(document_id));

-- 6. Collaborators Policies
DROP POLICY IF EXISTS "collaborators_select" ON public.collaborators;
CREATE POLICY "collaborators_select" ON public.collaborators
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.can_read_document(document_id)
  );

DROP POLICY IF EXISTS "collaborators_manage" ON public.collaborators;
CREATE POLICY "collaborators_manage" ON public.collaborators
  FOR ALL USING (public.can_manage_document(document_id));

-- 7. Storage Objects Policies
DROP POLICY IF EXISTS "storage_objects_select" ON public.storage_objects;
CREATE POLICY "storage_objects_select" ON public.storage_objects
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "storage_objects_insert" ON public.storage_objects;
CREATE POLICY "storage_objects_insert" ON public.storage_objects
  FOR INSERT WITH CHECK (public.can_edit_tenant(tenant_id));

-- 8. Structured Changes Policies
DROP POLICY IF EXISTS "version_texts_select" ON public.version_texts;
CREATE POLICY "version_texts_select" ON public.version_texts
  FOR SELECT USING (public.can_read_document(document_id));

DROP POLICY IF EXISTS "version_texts_insert" ON public.version_texts;
CREATE POLICY "version_texts_insert" ON public.version_texts
  FOR INSERT WITH CHECK (public.can_edit_document(document_id));

DROP POLICY IF EXISTS "version_texts_update" ON public.version_texts;
CREATE POLICY "version_texts_update" ON public.version_texts
  FOR UPDATE USING (public.can_edit_document(document_id));

DROP POLICY IF EXISTS "structured_changes_select" ON public.structured_changes;
CREATE POLICY "structured_changes_select" ON public.structured_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.versions v
      WHERE v.id = structured_changes.target_version_id
        AND public.can_read_document(v.document_id)
    )
  );

-- 9. Activity Events Policies
DROP POLICY IF EXISTS "activity_events_select" ON public.activity_events;
CREATE POLICY "activity_events_select" ON public.activity_events
  FOR SELECT USING (public.is_tenant_member(tenant_id));

DROP POLICY IF EXISTS "activity_events_insert" ON public.activity_events;
CREATE POLICY "activity_events_insert" ON public.activity_events
  FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id) OR auth.role() = 'authenticated');

-- 10. AI Proposals Policies
DROP POLICY IF EXISTS "ai_proposals_select" ON public.ai_proposals;
CREATE POLICY "ai_proposals_select" ON public.ai_proposals
  FOR SELECT USING (public.can_read_document(document_id));

DROP POLICY IF EXISTS "ai_proposals_insert" ON public.ai_proposals;
CREATE POLICY "ai_proposals_insert" ON public.ai_proposals
  FOR INSERT WITH CHECK (public.can_edit_document(document_id));

DROP POLICY IF EXISTS "ai_proposals_update" ON public.ai_proposals;
CREATE POLICY "ai_proposals_update" ON public.ai_proposals
  FOR UPDATE USING (public.can_edit_document(document_id));

-- ============================================================
-- PRIVATE STORAGE BUCKET
-- Bucket: documents (private)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50 MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.presentation',
    'application/vnd.oasis.opendocument.spreadsheet',
    'application/rtf',
    'text/plain',
    'text/markdown',
    'text/csv',
    'text/tab-separated-values',
    'application/json',
    'application/xml',
    'text/html'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;

-- ============================================================
-- STORAGE OBJECT POLICIES
-- Path convention: {tenantId}/{documentId}/{versionId}/{objectId}
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

-- ============================================================================
-- 002_fix_recursive_document_policies.sql
-- ============================================================================

-- ============================================================
-- Fix recursive RLS policies between documents and collaborators.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_document_collaborator(target_document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.collaborators c
    WHERE c.document_id = target_document_id
      AND c.user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_edit_document(target_document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = target_document_id
      AND (
        public.can_edit_tenant(d.tenant_id)
        OR EXISTS (
          SELECT 1
          FROM public.collaborators c
          WHERE c.document_id = d.id
            AND c.user_id = auth.uid()
            AND c.role IN ('OWNER', 'CONTRIBUTOR')
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_read_document(target_document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = target_document_id
      AND (
        public.is_tenant_member(d.tenant_id)
        OR public.is_document_collaborator(d.id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_document(target_document_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.documents d
    WHERE d.id = target_document_id
      AND (
        d.created_by = auth.uid()
        OR EXISTS (
          SELECT 1
          FROM public.memberships m
          WHERE m.tenant_id = d.tenant_id
            AND m.user_id = auth.uid()
            AND m.role = 'OWNER'
        )
        OR EXISTS (
          SELECT 1
          FROM public.collaborators c
          WHERE c.document_id = d.id
            AND c.user_id = auth.uid()
            AND c.role = 'OWNER'
        )
      )
  );
$$;

DROP POLICY IF EXISTS "documents_select" ON public.documents;
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (
    public.is_tenant_member(tenant_id) OR
    public.is_document_collaborator(id)
  );

DROP POLICY IF EXISTS "documents_update" ON public.documents;
CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (public.can_edit_document(id));

DROP POLICY IF EXISTS "collaborators_select" ON public.collaborators;
CREATE POLICY "collaborators_select" ON public.collaborators
  FOR SELECT USING (
    user_id = auth.uid() OR
    public.can_read_document(document_id)
  );

DROP POLICY IF EXISTS "collaborators_manage" ON public.collaborators;
CREATE POLICY "collaborators_manage" ON public.collaborators
  FOR ALL USING (public.can_manage_document(document_id));

DROP POLICY IF EXISTS "versions_select" ON public.versions;
CREATE POLICY "versions_select" ON public.versions
  FOR SELECT USING (public.can_read_document(document_id));

DROP POLICY IF EXISTS "versions_insert" ON public.versions;
CREATE POLICY "versions_insert" ON public.versions
  FOR INSERT WITH CHECK (public.can_edit_document(document_id));

DROP POLICY IF EXISTS "structured_changes_select" ON public.structured_changes;
CREATE POLICY "structured_changes_select" ON public.structured_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.versions v
      WHERE v.id = structured_changes.target_version_id
        AND public.can_read_document(v.document_id)
    )
  );

DROP POLICY IF EXISTS "ai_proposals_select" ON public.ai_proposals;
CREATE POLICY "ai_proposals_select" ON public.ai_proposals
  FOR SELECT USING (public.can_read_document(document_id));

DROP POLICY IF EXISTS "ai_proposals_insert" ON public.ai_proposals;
CREATE POLICY "ai_proposals_insert" ON public.ai_proposals
  FOR INSERT WITH CHECK (public.can_edit_document(document_id));

DROP POLICY IF EXISTS "ai_proposals_update" ON public.ai_proposals;
CREATE POLICY "ai_proposals_update" ON public.ai_proposals
  FOR UPDATE USING (public.can_edit_document(document_id));

-- ============================================================================
-- 003_fix_storage_object_policies.sql
-- ============================================================================

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

-- ============================================================================
-- 004_add_version_texts.sql
-- ============================================================================

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

-- ============================================================================
-- 005_allow_document_deletion_audit_refs.sql
-- ============================================================================

-- ============================================================
-- Allow full document/history deletion while preserving append-only audit rows.
-- Document/version references may be nulled by FK cleanup; audit content remains immutable.
-- ============================================================

ALTER TABLE public.activity_events
  DROP CONSTRAINT IF EXISTS activity_events_document_id_fkey;

ALTER TABLE public.activity_events
  ADD CONSTRAINT activity_events_document_id_fkey
  FOREIGN KEY (document_id)
  REFERENCES public.documents(id)
  ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION check_activity_events_append_only()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF OLD.tenant_id IS NOT DISTINCT FROM NEW.tenant_id
      AND OLD.actor_id IS NOT DISTINCT FROM NEW.actor_id
      AND OLD.actor_type IS NOT DISTINCT FROM NEW.actor_type
      AND OLD.event_type IS NOT DISTINCT FROM NEW.event_type
      AND OLD.metadata IS NOT DISTINCT FROM NEW.metadata
      AND OLD.created_at IS NOT DISTINCT FROM NEW.created_at
      AND (OLD.document_id IS NOT DISTINCT FROM NEW.document_id OR NEW.document_id IS NULL)
      AND (OLD.version_id IS NOT DISTINCT FROM NEW.version_id OR NEW.version_id IS NULL) THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'CANNOT_UPDATE_AUDIT_LOG: activity_events is strictly append-only';
  ELSIF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'CANNOT_DELETE_AUDIT_LOG: activity_events records cannot be deleted';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 006_harden_integrity_and_rls.sql
-- ============================================================================

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

-- ============================================================================
-- 007_atomic_version_finalize.sql
-- ============================================================================

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

-- ============================================================================
-- 008_soft_delete_documents.sql
-- ============================================================================

-- Preserve immutable versions and audit history when a document is deleted.
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS documents_active_tenant_idx
  ON public.documents (tenant_id, updated_at DESC)
  WHERE deleted_at IS NULL;

-- ============================================================================
-- 009_idempotency_keys.sql
-- ============================================================================

-- Durable idempotency records for retryable state-changing operations.
-- This table is intentionally service-role managed; clients never receive
-- direct read/write policies for request replay state.
CREATE TABLE IF NOT EXISTS public.idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'IN_FLIGHT' CHECK (status IN ('IN_FLIGHT', 'COMPLETED')),
  response_status INTEGER,
  response_body JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, operation, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idempotency_keys_expiry_idx
  ON public.idempotency_keys (created_at);

ALTER TABLE public.idempotency_keys ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.idempotency_keys FROM anon, authenticated;

COMMENT ON TABLE public.idempotency_keys IS
  'Service-managed replay protection. Retain only for the configured idempotency window.';

-- ============================================================================
-- 010_expand_document_file_types.sql
-- ============================================================================

-- Keep the private document bucket aligned with the application upload contract.
-- Existing installations need this migration; changing 001 alone would not update
-- an already-created Supabase Storage bucket.

UPDATE storage.buckets
SET allowed_mime_types = NULL
WHERE id = 'documents';

-- ============================================================================
-- 011_keep_document_head_on_default_branch.sql
-- ============================================================================

-- A document's current_version_id is the authoritative/default branch HEAD.
-- Feature branch commits must advance only their branch head.

CREATE OR REPLACE FUNCTION public.keep_document_head_on_default_branch()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  selected_branch_id UUID;
  default_head_id UUID;
BEGIN
  IF NEW.current_version_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT v.branch_id
    INTO selected_branch_id
    FROM public.versions v
   WHERE v.id = NEW.current_version_id
     AND v.document_id = NEW.id;

  IF selected_branch_id IS NULL OR selected_branch_id = NEW.default_branch_id THEN
    RETURN NEW;
  END IF;

  SELECT b.head_version_id
    INTO default_head_id
    FROM public.branches b
   WHERE b.id = NEW.default_branch_id
     AND b.document_id = NEW.id;

  NEW.current_version_id := COALESCE(default_head_id, NEW.current_version_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_document_current_default_branch ON public.documents;
CREATE TRIGGER tr_document_current_default_branch
  BEFORE UPDATE OF current_version_id ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.keep_document_head_on_default_branch();

-- Repair documents created before this invariant was installed.
UPDATE public.documents d
   SET current_version_id = b.head_version_id
  FROM public.branches b
 WHERE b.id = d.default_branch_id
   AND b.document_id = d.id
   AND b.head_version_id IS NOT NULL
   AND d.current_version_id IS DISTINCT FROM b.head_version_id;

-- ============================================================================
-- 012_strict_branch_names.sql
-- ============================================================================

-- Keep branch identifiers safe and stable across API clients.
-- NOT VALID preserves legacy rows so this migration can be deployed before a
-- one-time data cleanup; new and updated rows are enforced immediately.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'branches_name_format_check'
  ) THEN
    ALTER TABLE public.branches
      ADD CONSTRAINT branches_name_format_check
      CHECK (
        name = lower(name)
        AND length(name) BETWEEN 1 AND 100
        AND name ~ '^[a-z0-9]([a-z0-9_-]*[a-z0-9])?$'
      ) NOT VALID;
  END IF;
END $$;

COMMENT ON CONSTRAINT branches_name_format_check ON public.branches IS
  'Branch names are lowercase stable identifiers and cannot contain path separators or whitespace.';

-- 013_unrestricted_document_file_types.sql
UPDATE storage.buckets
SET allowed_mime_types = NULL,
    file_size_limit = 52428800,
    public = false
WHERE id = 'documents';

-- 014_permanent_document_delete.sql
CREATE OR REPLACE FUNCTION public.check_version_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
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
  SELECT d.tenant_id, d.title INTO document_tenant_id, document_title
    FROM public.documents d WHERE d.id = p_document_id;
  IF document_tenant_id IS NULL THEN RAISE EXCEPTION 'DOCUMENT_NOT_FOUND'; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.memberships m
     WHERE m.tenant_id = document_tenant_id AND m.user_id = p_actor_id AND m.role = 'OWNER'
  ) AND NOT EXISTS (
    SELECT 1 FROM public.documents d
     WHERE d.id = p_document_id AND d.created_by = p_actor_id
  ) THEN
    RAISE EXCEPTION 'DOCUMENT_PURGE_NOT_AUTHORIZED';
  END IF;

  PERFORM set_config('versionvault.purge_document', 'on', true);

  INSERT INTO public.activity_events (tenant_id, actor_id, actor_type, event_type, metadata)
  VALUES (document_tenant_id, p_actor_id::TEXT, 'human', 'DOCUMENT_DELETED',
          jsonb_build_object('title', document_title, 'permanent', true, 'documentId', p_document_id));

  DELETE FROM public.ai_proposals WHERE document_id = p_document_id;

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
    IF pass_count > 10000 THEN RAISE EXCEPTION 'DOCUMENT_VERSION_GRAPH_INVALID'; END IF;
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

-- 015_ai_text_shadow_columns.sql
-- Keep uploaded originals and AI-readable extracted text explicitly separate.
ALTER TABLE public.version_texts
  ADD COLUMN IF NOT EXISTS original_mime_type TEXT,
  ADD COLUMN IF NOT EXISTS content_mime_type TEXT NOT NULL DEFAULT 'text/plain; charset=utf-8';

UPDATE public.version_texts
SET original_mime_type = COALESCE(original_mime_type, mime_type),
    content_mime_type = COALESCE(NULLIF(content_mime_type, ''), 'text/plain; charset=utf-8');

ALTER TABLE public.version_texts
  ALTER COLUMN original_mime_type SET NOT NULL;

-- Ensure PostgREST sees functions/tables created by this script immediately.
NOTIFY pgrst, 'reload schema';

COMMIT;
