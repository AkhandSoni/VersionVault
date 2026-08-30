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
