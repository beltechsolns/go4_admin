CREATE TABLE IF NOT EXISTS order_ratings (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES customer_orders(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  food_quality INTEGER CHECK (food_quality >= 1 AND food_quality <= 5),
  delivery_speed INTEGER CHECK (delivery_speed >= 1 AND delivery_speed <= 5),
  overall INTEGER NOT NULL CHECK (overall >= 1 AND overall <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_order_ratings_order ON order_ratings(order_id);
