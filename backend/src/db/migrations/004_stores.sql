CREATE TABLE IF NOT EXISTS stores (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) DEFAULT 'Restaurant',
  location VARCHAR(200),
  phone VARCHAR(20),
  rating DECIMAL(2,1) DEFAULT 5.0,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(10) DEFAULT '📦',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100),
  price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  emoji VARCHAR(10) DEFAULT '📦',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
