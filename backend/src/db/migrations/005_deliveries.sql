CREATE TABLE IF NOT EXISTS deliveries (
  id SERIAL PRIMARY KEY,
  order_number VARCHAR(20) UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  customer_name VARCHAR(100),
  rider_id INTEGER REFERENCES riders(id) ON DELETE SET NULL,
  rider_name VARCHAR(100),
  store_id INTEGER REFERENCES stores(id) ON DELETE SET NULL,
  location VARCHAR(200),
  amount DECIMAL(10, 2) DEFAULT 0,
  status VARCHAR(30) DEFAULT 'Pending' CHECK (status IN ('Pending','Accepted','Picked Up','In Transit','Delivered','Failed','Cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delivery_status_history (
  id SERIAL PRIMARY KEY,
  delivery_id INTEGER REFERENCES deliveries(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
