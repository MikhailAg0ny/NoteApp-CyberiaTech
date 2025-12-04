-- Adds a dedicated cardano_address field for the simplified wallet flow
BEGIN;

ALTER TABLE users ADD COLUMN cardano_address VARCHAR(255);

CREATE UNIQUE INDEX idx_users_cardano_address_unique
  ON users(cardano_address)
  WHERE cardano_address IS NOT NULL;

COMMIT;
