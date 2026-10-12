/**
 * Repo supabase/migrations/*.sql ↔ remote_migrations.snapshot.json 대조 (ISS-052)
 * Usage: node scripts/audit-migration-sync.mjs
 */
import fs from 'fs';
import path from 'path';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const snapshotPath = path.join(process.cwd(), 'supabase', 'remote_migrations.snapshot.json');

function normalizeSlug(s) {
  return s
    .toLowerCase()
    .replace(/^20261002_/, '20261002_')
    .replace(/\.sql$/i, '')
    .replace(/-/g, '_');
}

function localSlugs() {
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql'));
  return files.map((f) => {
    const base = f.replace(/\.sql$/i, '');
    const slug = base.replace(/^\d+_?/, '').replace(/^\d{8}[a-z]?_/, '');
    return { file: f, slug: normalizeSlug(slug), base: normalizeSlug(base) };
  });
}

function remoteRows() {
  if (!fs.existsSync(snapshotPath)) {
    console.error('Missing', snapshotPath, '— run export-remote-migrations.mjs first');
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  return data.migrations.map((m) => ({
    version: m.version,
    name: m.name,
    slug: normalizeSlug(m.name),
  }));
}

function matches(local, remote) {
  if (local.slug === remote.slug) return true;
  if (local.base.includes(remote.slug) || remote.slug.includes(local.slug)) return true;
  if (local.file.replace(/\.sql$/, '') === remote.name) return true;
  return false;
}

const locals = localSlugs();
const remotes = remoteRows();

const remoteUnmatched = remotes.filter((r) => !locals.some((l) => matches(l, r)));
const localUnmatched = locals.filter((l) => !remotes.some((r) => matches(l, r)));

console.log('Local SQL files:', locals.length);
console.log('Remote migrations:', remotes.length);
console.log('\n--- Remote without plausible local file (', remoteUnmatched.length, ') ---');
for (const r of remoteUnmatched.slice(0, 40)) {
  console.log(r.version, r.name);
}
if (remoteUnmatched.length > 40) console.log('... +', remoteUnmatched.length - 40, 'more');

console.log('\n--- Local file without remote name match (', localUnmatched.length, ') ---');
for (const l of localUnmatched) {
  console.log(l.file);
}

process.exit(remoteUnmatched.length > 0 || localUnmatched.length > 0 ? 2 : 0);
