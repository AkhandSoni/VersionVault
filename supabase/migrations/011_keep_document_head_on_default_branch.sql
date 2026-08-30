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
