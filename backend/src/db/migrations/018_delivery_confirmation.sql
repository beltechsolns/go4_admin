-- Add delivery confirmation fields
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS rider_delivered_at TIMESTAMPTZ;
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS customer_delivered_at TIMESTAMPTZ;
