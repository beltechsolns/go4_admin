CREATE TABLE IF NOT EXISTS pricing (
  id SERIAL PRIMARY KEY,
  base_fee DECIMAL(10,2) DEFAULT 30.00,
  per_km_rate DECIMAL(10,2) DEFAULT 10.00,
  service_charge DECIMAL(5,2) DEFAULT 5.00,
  min_order DECIMAL(10,2) DEFAULT 50.00,
  peak_surcharge DECIMAL(10,2) DEFAULT 20.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO pricing (base_fee, per_km_rate, service_charge, min_order, peak_surcharge)
VALUES (30.00, 10.00, 5.00, 50.00, 20.00)
ON CONFLICT DO NOTHING;
