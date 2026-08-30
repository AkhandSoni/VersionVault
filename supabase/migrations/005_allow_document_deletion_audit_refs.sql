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
