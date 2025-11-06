-- Migration: Add Agent Role and Support
-- This migration adds agent role support to the system

-- Step 1: Update users table to include 'agent' role
ALTER TABLE users 
  DROP CONSTRAINT IF EXISTS users_role_check;
  
ALTER TABLE users 
  ADD CONSTRAINT users_role_check 
  CHECK (role IN ('admin', 'provider', 'student', 'agent'));

-- Step 2: Create agents table (similar to providers table)
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
    business_name VARCHAR(200) NOT NULL,
    business_registration VARCHAR(100),
    contact_person VARCHAR(100) NOT NULL,
    contact_email VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    website_url VARCHAR(500),
    description TEXT,
    is_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: Add agent_id column to accommodations table
ALTER TABLE accommodations 
  ADD COLUMN IF NOT EXISTS agent_id VARCHAR(255) REFERENCES agents(id) ON DELETE SET NULL;

-- Step 4: Create index for agent_id in accommodations
CREATE INDEX IF NOT EXISTS idx_accommodations_agent_id ON accommodations(agent_id);

-- Step 5: Create index for user_id in agents table
CREATE INDEX IF NOT EXISTS idx_agents_user_id ON agents(user_id);

-- Step 6: Add billing support for agents (similar to providers)
-- Add agent_id column to payment_transactions table
ALTER TABLE payment_transactions 
  ADD COLUMN IF NOT EXISTS agent_id VARCHAR(255) REFERENCES agents(id) ON DELETE SET NULL;

-- Create index for agent_id in payment_transactions
CREATE INDEX IF NOT EXISTS idx_payment_txn_agent_id ON payment_transactions(agent_id);

