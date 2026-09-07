ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS delivery_group_id VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_customer_orders_group ON customer_orders(delivery_group_id);
