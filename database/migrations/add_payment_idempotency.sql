-- Migration: Add Idempotency Key Support for Payments
-- This migration adds idempotency key support to prevent duplicate payments
-- Date: 2025-11-06
-- Purpose: Enable idempotent payment processing to prevent duplicate charges

BEGIN;

-- Step 1: Add idempotency_key column to payment_transactions table
-- This column stores unique keys that identify payment requests
-- UNIQUE constraint ensures no duplicate keys can be inserted
ALTER TABLE payment_transactions 
  ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255) UNIQUE;

-- Step 2: Create index for idempotency_key for fast lookups
-- This index is critical for performance when checking for existing transactions
CREATE INDEX IF NOT EXISTS idx_payment_transactions_idempotency_key 
  ON payment_transactions(idempotency_key);

-- Verify the migration was successful
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' 
    AND column_name = 'idempotency_key'
  ) THEN
    RAISE EXCEPTION 'Migration failed: idempotency_key column was not created';
  END IF;
END $$;

COMMIT;

