# POPUP DB migrations

| | |
|---|---|
| **Canonical SQL** | `migrations/*.sql` |
| **원격 이력 스냅샷** | `remote_migrations.snapshot.json` — `node scripts/export-remote-migrations.mjs` |
| **Repo ↔ 원격 감사** | `node scripts/audit-migration-sync.mjs` → `migration-audit.snapshot.json` |
| **DDL 적용 (권장)** | Supabase MCP `apply_migration` 또는 Dashboard SQL |
| **비상** | `node scripts/apply-sql-file.mjs <file.sql> <migration_name>` — `schema_migrations` 기록 |

ISS-052: 원격 이력(100+)과 repo 파일(50+)은 **1:1 버전이 아닐 수 있음** — 초기 init은 원격에 잘게, repo는 묶음 파일. User PC **`supabase link`** ✅ 후 **`db pull --declarative --linked`** → `schemas/` (§7.101). **classic `db pull` mismatch** 시 User **`migration repair` 실행 ❌**.
