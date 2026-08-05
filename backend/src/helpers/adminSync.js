import { query } from '../config/db.js';

// Sync a customer app user into the admin `customers` table
export async function syncCustomerToAdmin(user) {
  if (!user || user.role === 'rider') return;
  if (!user.phone && !user.email) return;

  // Find existing admin customer by phone OR email
  const { rows } = await query(
    'SELECT id FROM customers WHERE ($1::text IS NOT NULL AND phone = $1) OR ($2::text IS NOT NULL AND email = $2)',
    [user.phone || null, user.email || null]
  );

  if (rows.length) {
    await query(
      `UPDATE customers SET
         full_name = COALESCE($1, full_name),
         phone = COALESCE($2, phone),
         email = COALESCE($3, email)
       WHERE id = $4`,
      [user.name, user.phone || null, user.email || null, rows[0].id]
    );
  } else {
    await query(
      `INSERT INTO customers (full_name, phone, email, status, joined_date)
       VALUES ($1, $2, $3, 'Active', CURRENT_DATE)`,
      [user.name, user.phone || '', user.email || null]
    );
  }
}

// Sync a rider app user into the admin `riders` table
export async function syncRiderToAdmin(user) {
  if (!user || user.role !== 'rider') return;

  const { rows } = await query(
    'SELECT id FROM riders WHERE ($1::text IS NOT NULL AND phone = $1) OR ($2::text IS NOT NULL AND email = $2)',
    [user.phone || null, user.email || null]
  );

  if (rows.length) {
    await query(
      `UPDATE riders SET full_name = $1, phone = COALESCE($2, phone), email = COALESCE($3, email), user_id = $4 WHERE id = $5`,
      [user.name, user.phone || null, user.email || null, user.id, rows[0].id]
    );
  } else {
    await query(
      `INSERT INTO riders (full_name, phone, email, user_id, status)
       VALUES ($1, $2, $3, $4, 'Offline')`,
      [user.name, user.phone || '', user.email || null, user.id]
    );
  }
}
