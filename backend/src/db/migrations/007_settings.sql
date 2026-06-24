CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  app_name VARCHAR(100) DEFAULT 'G4 Delivery',
  support_email VARCHAR(150) DEFAULT 'support@g4delivery.com',
  support_phone VARCHAR(20) DEFAULT '+251 911 000 000',
  notify_new_order BOOLEAN DEFAULT true,
  notify_delivery_complete BOOLEAN DEFAULT true,
  notify_rider_offline BOOLEAN DEFAULT true,
  language VARCHAR(5) DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO settings DEFAULT VALUES
ON CONFLICT DO NOTHING;
