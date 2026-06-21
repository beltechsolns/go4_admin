CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(150),
  total_orders INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'Banned')),
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
