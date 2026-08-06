-- Make categories global (shared across all restaurants)

-- 1. Deduplicate categories by name (keep the lowest id), repoint products
UPDATE products p
SET category_id = keep.id
FROM (
  SELECT MIN(id) AS id, LOWER(name) AS lname
  FROM categories
  GROUP BY LOWER(name)
) keep
JOIN categories dup ON LOWER(dup.name) = keep.lname AND dup.id <> keep.id
WHERE p.category_id = dup.id;

-- 2. Delete duplicate categories
DELETE FROM categories c
USING (
  SELECT MIN(id) AS id, LOWER(name) AS lname
  FROM categories
  GROUP BY LOWER(name)
) keep
WHERE LOWER(c.name) = keep.lname AND c.id <> keep.id;

-- 3. Drop store_id FK so categories are truly global
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_store_id_fkey;
UPDATE categories SET store_id = NULL;

-- 4. Seed common categories if the table is empty
INSERT INTO categories (name, icon)
SELECT * FROM (VALUES
  ('Pizza', '🍕'),
  ('Burger', '🍔'),
  ('Drinks', '🥤'),
  ('Desserts', '🍰'),
  ('Sides', '🍟'),
  ('Main Dishes', '🍲'),
  ('Breakfast', '🍳'),
  ('Salads', '🥗'),
  ('Groceries', '🛒'),
  ('Fruits', '🍎'),
  ('Vegetables', '🥦'),
  ('Bakery', '🥐'),
  ('Juice', '🧃'),
  ('Coffee', '☕'),
  ('Snacks', '🍿'),
  ('Ice Cream', '🍨')
) AS seed(name, icon)
WHERE NOT EXISTS (SELECT 1 FROM categories);
