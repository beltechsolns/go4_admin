CREATE TABLE IF NOT EXISTS riders (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(30) DEFAULT 'Bike' CHECK (vehicle_type IN ('Bike', 'Car', 'Motorcycle')),
  zone VARCHAR(100),
  total_deliveries INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 5.0,
  status VARCHAR(20) DEFAULT 'Offline' CHECK (status IN ('Online', 'Offline', 'Busy')),
  current_lat DECIMAL(10, 7),
  current_lng DECIMAL(10, 7),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
