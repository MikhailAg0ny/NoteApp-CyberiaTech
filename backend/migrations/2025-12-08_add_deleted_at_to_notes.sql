-- Soft delete support for notes (30-day trash)
BEGIN;

ALTER TABLE notes
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Optional: index for cleanup/queries
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON notes(deleted_at);

COMMIT;
