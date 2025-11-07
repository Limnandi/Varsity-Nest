-- Migration: Add PayFast Payment and Subscription Tokens
-- This migration adds payment_token and subscription_token columns to support
-- PayFast refunds and recurring billing management
-- Date: 2025-01-XX
-- Purpose: Enable refund capability and subscription management via PayFast API

BEGIN;

-- Step 1: Add payment_token and subscription_token to payment_transactions table
-- These tokens are returned by PayFast and required for refunds and subscription management
ALTER TABLE payment_transactions 
  ADD COLUMN IF NOT EXISTS payment_token VARCHAR(255),
  ADD COLUMN IF NOT EXISTS subscription_token VARCHAR(255);

-- Step 2: Add subscription_token to providers table
-- This token is used to manage recurring subscriptions via PayFast API
ALTER TABLE providers 
  ADD COLUMN IF NOT EXISTS subscription_token VARCHAR(255);

-- Step 3: Add subscription_token to agents table
-- This token is used to manage recurring subscriptions via PayFast API
ALTER TABLE agents 
  ADD COLUMN IF NOT EXISTS subscription_token VARCHAR(255);

-- Step 4: Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payment_token 
  ON payment_transactions(payment_token);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_subscription_token 
  ON payment_transactions(subscription_token);

CREATE INDEX IF NOT EXISTS idx_providers_subscription_token 
  ON providers(subscription_token);

CREATE INDEX IF NOT EXISTS idx_agents_subscription_token 
  ON agents(subscription_token);

-- Verify the migration was successful
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' 
    AND column_name = 'payment_token'
  ) THEN
    RAISE EXCEPTION 'Migration failed: payment_token column was not created';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_transactions' 
    AND column_name = 'subscription_token'
  ) THEN
    RAISE EXCEPTION 'Migration failed: subscription_token column was not created in payment_transactions';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'providers' 
    AND column_name = 'subscription_token'
  ) THEN
    RAISE EXCEPTION 'Migration failed: subscription_token column was not created in providers';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'agents' 
    AND column_name = 'subscription_token'
  ) THEN
    RAISE EXCEPTION 'Migration failed: subscription_token column was not created in agents';
  END IF;
END $$;

COMMIT;

