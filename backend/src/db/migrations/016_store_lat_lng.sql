-- Add latitude and longitude to stores for delivery time estimation
ALTER TABLE stores ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,7);
ALTER TABLE stores ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,7);
