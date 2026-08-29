-- ============================================================
-- VersionVault — Initial Schema & RLS Policies (Person 1)
-- Database: PostgreSQL + Supabase Row Level Security
-- See SECURITY.md for mandatory security invariants.
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. TENANTS
-- Organization / workspace boundaries
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 2. MEMBERSHIPS
-- Maps users to tenants with distinct authorization roles
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'CONTRIBUTOR', 'VIEWER')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, tenant_id)
);

-- ------------------------------------------------------------
-- 3. DOCUMENTS
-- Logical document entity within a tenant
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 4. BRANCHES
-- Alternate lineage trees for documents
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  head_version_id UUID,
  base_version_id UUID,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, name)
);

-- ------------------------------------------------------------
-- 5. VERSIONS
-- Immutable document snapshots
-- ------------------------------------------------------------
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

-- Foreign key constraints for documents & branches referencing versions
ALTER TABLE public.documents
  ADD CONSTRAINT fk_documents_current_version
  FOREIGN KEY (current_version_id) REFERENCES public.versions(id) ON DELETE SET NULL;

ALTER TABLE public.documents
  ADD CONSTRAINT fk_documents_default_branch
  FOREIGN KEY (default_branch_id) REFERENCES public.branches(id) ON DELETE SET NULL;

ALTER TABLE public.branches
  ADD CONSTRAINT fk_branches_head_version
  FOREIGN KEY (head_version_id) REFERENCES public.versions(id) ON DELETE SET NULL;

ALTER TABLE public.branches
  ADD CONSTRAINT fk_branches_base_version
  FOREIGN KEY (base_version_id) REFERENCES public.versions(id) ON DELETE SET NULL;

-- ------------------------------------------------------------
-- 6. COLLABORATORS
-- Document-level explicit collaborator permissions
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('OWNER', 'CONTRIBUTOR', 'VIEWER')),
  added_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, user_id)
);

-- ------------------------------------------------------------
-- 7. STORAGE OBJECTS
-- Private storage file metadata
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 8. STRUCTURED CHANGES
-- Deterministic diff output between versions
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 9. PROCESSING JOBS
-- Background worker tracking
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 10. ACTIVITY EVENTS (Audit Log)
-- Append-only audit trail
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  version_id UUID REFERENCES public.versions(id) ON DELETE SET NULL,
  actor_id TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('human', 'user', 'ai_agent')),
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------
-- 11. AI EXPLANATIONS
-- Grounded interpretations
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- 12. AI PROPOSALS
-- Proposed modifications awaiting human review
-- ------------------------------------------------------------
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

-- A. Prevent mutation of READY versions (SECURITY.md §23)
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

-- B. Prevent mutation or deletion of Activity Audit Logs (SECURITY.md §36)
CREATE OR REPLACE FUNCTION check_activity_events_append_only()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
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
-- Multi-Tenant Isolation (SECURITY.md §6, §7)
-- ============================================================

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.storage_objects ENABLE ROW LEVEL SECURITY;
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

-- 1. Tenants Policies
CREATE POLICY "tenants_select_membership" ON public.tenants
  FOR SELECT USING (public.is_tenant_member(id));

CREATE POLICY "tenants_insert_authenticated" ON public.tenants
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "tenants_update_owner" ON public.tenants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = id AND user_id = auth.uid() AND role = 'OWNER'
    )
  );

-- 2. Memberships Policies
CREATE POLICY "memberships_select_tenant" ON public.memberships
  FOR SELECT USING (public.is_tenant_member(tenant_id));

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

CREATE POLICY "memberships_update_owner" ON public.memberships
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = memberships.tenant_id AND user_id = auth.uid() AND role = 'OWNER'
    )
  );

CREATE POLICY "memberships_delete_owner" ON public.memberships
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.memberships
      WHERE tenant_id = memberships.tenant_id AND user_id = auth.uid() AND role = 'OWNER'
    )
  );

-- 3. Documents Policies
CREATE POLICY "documents_select" ON public.documents
  FOR SELECT USING (
    public.is_tenant_member(tenant_id) OR
    EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE document_id = documents.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "documents_insert" ON public.documents
  FOR INSERT WITH CHECK (
    public.can_edit_tenant(tenant_id) AND created_by = auth.uid()
  );

CREATE POLICY "documents_update" ON public.documents
  FOR UPDATE USING (
    public.can_edit_tenant(tenant_id) OR
    EXISTS (
      SELECT 1 FROM public.collaborators
      WHERE document_id = documents.id AND user_id = auth.uid() AND role IN ('OWNER', 'CONTRIBUTOR')
    )
  );

-- 4. Branches Policies
CREATE POLICY "branches_select" ON public.branches
  FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "branches_insert" ON public.branches
  FOR INSERT WITH CHECK (public.can_edit_tenant(tenant_id));

CREATE POLICY "branches_update" ON public.branches
  FOR UPDATE USING (public.can_edit_tenant(tenant_id));

-- 5. Versions Policies
CREATE POLICY "versions_select" ON public.versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = versions.document_id AND (
        public.is_tenant_member(d.tenant_id) OR
        EXISTS (SELECT 1 FROM public.collaborators c WHERE c.document_id = d.id AND c.user_id = auth.uid())
      )
    )
  );

CREATE POLICY "versions_insert" ON public.versions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = versions.document_id AND (
        public.can_edit_tenant(d.tenant_id) OR
        EXISTS (SELECT 1 FROM public.collaborators c WHERE c.document_id = d.id AND c.user_id = auth.uid() AND c.role IN ('OWNER', 'CONTRIBUTOR'))
      )
    )
  );

-- 6. Collaborators Policies
CREATE POLICY "collaborators_select" ON public.collaborators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = collaborators.document_id AND (
        public.is_tenant_member(d.tenant_id) OR
        collaborators.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "collaborators_manage" ON public.collaborators
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = collaborators.document_id AND (
        EXISTS (
          SELECT 1 FROM public.memberships m
          WHERE m.tenant_id = d.tenant_id AND m.user_id = auth.uid() AND m.role = 'OWNER'
        ) OR
        EXISTS (
          SELECT 1 FROM public.collaborators c
          WHERE c.document_id = d.id AND c.user_id = auth.uid() AND c.role = 'OWNER'
        )
      )
    )
  );

-- 7. Storage Objects Policies
CREATE POLICY "storage_objects_select" ON public.storage_objects
  FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "storage_objects_insert" ON public.storage_objects
  FOR INSERT WITH CHECK (public.can_edit_tenant(tenant_id));

-- 8. Structured Changes Policies
CREATE POLICY "structured_changes_select" ON public.structured_changes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.versions v
      JOIN public.documents d ON d.id = v.document_id
      WHERE v.id = structured_changes.target_version_id AND (
        public.is_tenant_member(d.tenant_id) OR
        EXISTS (SELECT 1 FROM public.collaborators c WHERE c.document_id = d.id AND c.user_id = auth.uid())
      )
    )
  );

-- 9. Activity Events Policies
CREATE POLICY "activity_events_select" ON public.activity_events
  FOR SELECT USING (public.is_tenant_member(tenant_id));

CREATE POLICY "activity_events_insert" ON public.activity_events
  FOR INSERT WITH CHECK (public.is_tenant_member(tenant_id) OR auth.role() = 'authenticated');

-- 10. AI Proposals Policies
CREATE POLICY "ai_proposals_select" ON public.ai_proposals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = ai_proposals.document_id AND public.is_tenant_member(d.tenant_id)
    )
  );

CREATE POLICY "ai_proposals_insert" ON public.ai_proposals
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = ai_proposals.document_id AND public.can_edit_tenant(d.tenant_id)
    )
  );

CREATE POLICY "ai_proposals_update" ON public.ai_proposals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.id = ai_proposals.document_id AND public.can_edit_tenant(d.tenant_id)
    )
  );

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
    'text/plain',
    'text/markdown'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800;
