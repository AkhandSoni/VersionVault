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
