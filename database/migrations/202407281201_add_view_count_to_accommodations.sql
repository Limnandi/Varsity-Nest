-- Add view_count column to accommodations table
ALTER TABLE accommodations
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Update existing records to initialize view_count
UPDATE accommodations 
SET view_count = 0
WHERE view_count IS NULL;