-- Migration: Create whitelisted_domains table
-- Date: 2025-01-03 10:12:00
-- Description: Creates the whitelisted_domains table for live domain management

-- Create whitelisted_domains table
CREATE TABLE IF NOT EXISTS whitelisted_domains (
    id VARCHAR(255) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    domain VARCHAR(255) NOT NULL UNIQUE,
    university VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Insert default domains
INSERT INTO whitelisted_domains (domain, university, is_active) VALUES
('@ufs4life.ac.za', 'UFS', true),
('@student.ufs.ac.za', 'UFS', true),
('@cut.ac.za', 'CUT', true),
('@student.cut.ac.za', 'CUT', true)
ON CONFLICT (domain) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_whitelisted_domains_updated_at 
    BEFORE UPDATE ON whitelisted_domains 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_whitelisted_domains_active ON whitelisted_domains(is_active);
CREATE INDEX IF NOT EXISTS idx_whitelisted_domains_domain ON whitelisted_domains(domain);

-- Verify the table was created
SELECT 'whitelisted_domains table created successfully' as status;