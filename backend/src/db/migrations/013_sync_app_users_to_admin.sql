-- Backfill existing app users into admin tables

INSERT INTO customers (full_name, phone, email, status, joined_date)
SELECT name, phone, email, 'Active', CURRENT_DATE
FROM users u
WHERE role = 'customer'
  AND NOT EXISTS (
    SELECT 1 FROM customers c
    WHERE (u.phone IS NOT NULL AND c.phone = u.phone)
       OR (u.email IS NOT NULL AND c.email IS NOT NULL AND c.email = u.email)
  );

INSERT INTO riders (full_name, phone, email, user_id, status)
SELECT name, phone, email, id, 'Offline'
FROM users u
WHERE role = 'rider'
  AND NOT EXISTS (
    SELECT 1 FROM riders r
    WHERE (u.phone IS NOT NULL AND r.phone = u.phone)
       OR (u.email IS NOT NULL AND r.email IS NOT NULL AND r.email = u.email)
  );
