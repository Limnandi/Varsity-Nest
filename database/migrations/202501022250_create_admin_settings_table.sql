-- Migration: Create admin_settings table
-- Date: 2025-01-02 22:50:00
-- Description: Creates the missing admin_settings table that is referenced in the application

-- Create admin_settings table
CREATE TABLE IF NOT EXISTS admin_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    maintenance_mode BOOLEAN DEFAULT false,
    registration_enabled BOOLEAN DEFAULT true,
    payments_enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT single_row CHECK (id = 1)
);

-- Insert default admin settings
INSERT INTO admin_settings (id, maintenance_mode, registration_enabled, payments_enabled)
VALUES (1, false, true, true)
ON CONFLICT (id) DO NOTHING;

-- Create trigger for updated_at
CREATE TRIGGER update_admin_settings_updated_at 
    BEFORE UPDATE ON admin_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Verify the table was created
SELECT 'admin_settings table created successfully' as status;