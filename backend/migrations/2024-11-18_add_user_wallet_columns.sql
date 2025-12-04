-- Adds wallet metadata to the users table so accounts can be linked to on-chain addresses
BEGIN;

ALTER TABLE users
  ADD COLUMN wallet_address VARCHAR(255);

ALTER TABLE users
  ADD COLUMN wallet_label VARCHAR(100);

ALTER TABLE users
  ADD COLUMN wallet_network VARCHAR(50) DEFAULT 'mainnet';

ALTER TABLE users
  ADD COLUMN wallet_connected_at TIMESTAMPTZ;

CREATE UNIQUE INDEX idx_users_wallet_address_unique
  ON users(wallet_address)
  WHERE wallet_address IS NOT NULL;

COMMIT;
