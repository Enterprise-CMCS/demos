# `sql/02_seeds_static/`

Applied by `migrate seeds` (after `migrate ddl`, before `migrate crosswalks`).

## What lives here now

Migration-private reference data and registry loads that the
Prisma-owned `app.*` schema does **not** provide:

- `25_state_region.sql` — `migration.state_region`, the CMS/HHS region
  (1–10) per state. Prisma's `app.state` is `(id, name)` only and has no
  `region` column, but the migration needs the region to validate the
  PMDA `11-W-NNNNN/R` project number.

JSONB schemas are registered from `reports/jsonb_schemas/*.schema.json`
by `migration.phases.init_pg.load_jsonb_schemas` at the end of
`migrate seeds` (not via a SQL file — the pipeline applies SQL through
psycopg, where `pg_read_file` of a repo-relative path is not reliable).

## What does NOT live here (Prisma owns it)

Per the DDL-ownership amendment, the DEMOS app team owns the `app.*`
schema **and seeds its lookup data** via the Prisma artifact that
`migrate ddl` fetches, pins, and applies. All **29 static-constraint**
tables (`application_status`, `document_type`, `deliverable_type`,
`role`, `permission`, `phase`, `tag_*`, …) and all **14 type-limiter**
tables (`*_limit`) are `INSERT`ed by that artifact. Do **not** re-author
those seeds here — duplicating them risks drift from the canonical
Prisma values (e.g. `application_status` = `Pre-Submission` /
`Under Review` / `Approved` / `Denied` / `Withdrawn` / `On-hold`).
