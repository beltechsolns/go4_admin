-- Add description to stores
ALTER TABLE stores ADD COLUMN IF NOT EXISTS description TEXT;
