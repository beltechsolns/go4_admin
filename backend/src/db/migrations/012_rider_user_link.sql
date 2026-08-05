ALTER TABLE riders ADD COLUMN IF NOT EXISTS user_id INTEGER;

CREATE INDEX IF NOT EXISTS idx_riders_user_id ON riders(user_id);
