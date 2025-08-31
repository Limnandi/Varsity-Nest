-- Add is_featured column to providers
ALTER TABLE providers
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Optional index to quickly count featured providers
CREATE INDEX IF NOT EXISTS idx_providers_is_featured ON providers(is_featured);


