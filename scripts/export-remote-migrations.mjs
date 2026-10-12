/**
 * POPUP 원격 schema_migrations → supabase/remote_migrations.snapshot.json
 * Usage (from popup_store): set POPUP_DATABASE_URL → node scripts/export-remote-migrations.mjs
 */
import fs from 'fs';
import path from 'path';
import pg from 'pg';

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
  console.error('POPUP_DATABASE_URL required (or POPUP_DATABASE_URL in ../.env.local)');
  process.exit(1);
}

const outPath = path.join(process.cwd(), 'supabase', 'remote_migrations.snapshot.json');

const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  const { rows } = await client.query(
    `select version, name from supabase_migrations.schema_migrations order by version asc`,
  );
  const payload = {
    exported_at: new Date().toISOString(),
    project_ref: 'cvrtobxkvpcpcxrcspdp',
    count: rows.length,
    migrations: rows,
  };
  fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  console.log('Wrote', outPath, 'count=', rows.length);
} finally {
  await client.end();
}
