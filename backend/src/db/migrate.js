import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const migrationsDir = join(__dirname, 'migrations');

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('🔄 Starting database migrations...\n');

    // Create migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Get list of already-run migrations
    const { rows: done } = await client.query('SELECT filename FROM _migrations');
    const doneSet = new Set(done.map(r => r.filename));

    // Read migration files in order
    const files = readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of files) {
      if (doneSet.has(file)) {
        console.log(`⏭️  Skipping ${file} (already executed)`);
        continue;
      }

      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf8');

      try {
        await client.query('BEGIN');
        await client.query(sql);
        await client.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`✅ Executed ${file}`);
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`❌ Failed to execute ${file}:`, err.message);
        throw err;
      }
    }

    console.log('\n🎉 All migrations completed successfully!');
  } catch (err) {
    console.error('\n💥 Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
