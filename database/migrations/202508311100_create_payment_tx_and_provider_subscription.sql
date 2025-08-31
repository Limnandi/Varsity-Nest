-- Add provider subscription fields
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive' CHECK (subscription_status IN ('inactive','active','past_due','canceled')),
  ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS next_payment_date TIMESTAMP WITH TIME ZONE;

-- Create payment_transactions table for PayFast and other gateways
CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
  provider_id VARCHAR(255) REFERENCES providers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'ZAR',
  pf_payment_id VARCHAR(100), -- PayFast gateway transaction id
  m_payment_id VARCHAR(100),  -- Our merchant-generated id
  transaction_id VARCHAR(100), -- Backward-compat column if referenced elsewhere
  status VARCHAR(20) NOT NULL CHECK (status IN ('pending','completed','failed','cancelled')),
  payment_date TIMESTAMP WITH TIME ZONE,
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(pf_payment_id),
  UNIQUE(m_payment_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_tx_provider ON payment_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_tx_status ON payment_transactions(status);

-- updated_at trigger for payment_transactions
CREATE TRIGGER update_payment_transactions_updated_at
BEFORE UPDATE ON payment_transactions
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


