ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS delivery_lat DECIMAL(10,7);
ALTER TABLE customer_orders ADD COLUMN IF NOT EXISTS delivery_lng DECIMAL(10,7);

CREATE TABLE IF NOT EXISTS driver_ratings (
  id SERIAL PRIMARY KEY,
  rider_id INTEGER REFERENCES riders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  order_id INTEGER REFERENCES customer_orders(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_ratings_rider ON driver_ratings(rider_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_user ON driver_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_driver_ratings_order ON driver_ratings(order_id);
