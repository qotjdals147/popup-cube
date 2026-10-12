import fs from 'fs';
import path from 'path';
import pg from 'pg';

const file = process.argv[2];
const migrationName = process.argv[3];
if (!file) {
  console.error('Usage: node apply-sql-file.mjs <path.sql> [migration_name_for_history]');
  console.error('Prefer: supabase MCP apply_migration or CLI — raw pg does NOT update schema_migrations (ISS-052)');
  process.exit(1);
}
function loadEnvLocal() {
  const envPath = path.join(process.cwd(), '..', '.env.local');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^POPUP_DATABASE_URL=(.+)$/);
    if (m) process.env.POPUP_DATABASE_URL = m[1].trim();
  }
}
loadEnvLocal();
const url = process.env.POPUP_DATABASE_URL;
if (!url) {
  console.error('POPUP_DATABASE_URL required');
  process.exit(1);
}
const sql = fs.readFileSync(file, 'utf8');
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  await client.query(sql);
  if (migrationName) {
    const version = new Date()
      .toISOString()
      .replace(/[-:TZ.]/g, '')
      .slice(0, 14);
    await client.query(
      `insert into supabase_migrations.schema_migrations (version, name)
       values ($1, $2)
       on conflict (version) do nothing`,
      [version, migrationName],
    );
    console.log('OK', file, '+ schema_migrations', version, migrationName);
  } else {
    console.warn('WARN: schema_migrations not updated — pass migration_name or use apply_migration (ISS-052)');
    console.log('OK', file);
  }
} finally {
  await client.end();
}
