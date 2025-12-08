-- Add blockchain tracking columns to notes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='notes' AND column_name='tx_hash'
  ) THEN
    ALTER TABLE notes ADD COLUMN tx_hash TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='notes' AND column_name='tx_status'
  ) THEN
    ALTER TABLE notes ADD COLUMN tx_status TEXT DEFAULT 'pending';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='notes' AND column_name='cardano_address'
  ) THEN
    ALTER TABLE notes ADD COLUMN cardano_address TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='notes' AND column_name='chain_action'
  ) THEN
    ALTER TABLE notes ADD COLUMN chain_action TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='notes' AND column_name='chain_label'
  ) THEN
    ALTER TABLE notes ADD COLUMN chain_label BIGINT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='notes' AND column_name='chain_metadata'
  ) THEN
    ALTER TABLE notes ADD COLUMN chain_metadata JSONB;
  END IF;
END$$;
