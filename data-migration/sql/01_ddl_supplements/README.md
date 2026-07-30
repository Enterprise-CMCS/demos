# 01_ddl_supplements/

Migration-private DDL that layers on top of the Prisma-generated SQL the
DEMOS app team publishes. The Prisma artifact is fetched and applied first
in `migrate ddl`; this directory then runs to add things Prisma does not
model.

What lives here:

- `00_jsonb_schema_registry.sql` — `migration.jsonb_schemas` registry
  table, the `migration.tg_validate_jsonb_against_registered_schema()`
  trigger function, and the `migration.revalidate_jsonb(...)` one-shot
  helper. No schema currently wires a CONSTRAINT TRIGGER (the
  budget-neutrality parity oracle that once did was retired -- DEMOS owns BN
  ingestion from uploaded workbooks). Lives in the `migration` schema; not
  affected by the `DROP SCHEMA demos_app CASCADE` that `migrate ddl` issues
  before applying the Prisma SQL.

What does NOT live here:

- `demos_app.*` parent tables, FKs, indexes, sequences — owned by Prisma.
- `demos_app.*_history` tables and the `revision_type_enum` — owned by
  Prisma (created in the baseline migration with `revision_id`/`revision_type`).
  The `log_changes_*` capture triggers are owned by DEMOS
  (`server/src/sql/history_triggers.sql`). This migration does not populate
  those tables; they are left empty for the DEMOS capture triggers to fill
  post-cutover. A prior `10_history_shadows.sql` that re-created them under a
  different convention was removed as superseded.
- Static-constraint and type-limiter table DDL — owned by Prisma. We still
  seed their data via `sql/02_seeds_static/` and `sql/03_seeds_limiters/`.
- Foreign keys — captured from the Prisma DDL at `migrate ddl` time, dropped
  before the bulk build, and re-applied as `NOT VALID` + `VALIDATE` in
  `migrate constraints` (see `migration/phases/init_pg.py` and
  `migration/phases/constraints.py`).

## Apply order

1. `migrate ddl` lists the Prisma migration directories in the DEMOS repo
   (`migration/phases/fetch_prisma.py`), fetches each `migration.sql`,
   concatenates them chronologically, verifies the SHA256 against
   `reports/prisma_ddl.sha256`, drops and re-creates the `app` schema,
   applies the cached file, captures every FK definition to
   `state/prisma_fks.json`, drops those FKs, then applies every `*.sql` in
   this directory in lexical order.
2. `migrate seeds` fills in static-constraint + type-limiter rows.
3. `migrate constraints` re-creates the captured FKs as `NOT VALID`, then
   `VALIDATE`s them, then runs the rest of P5.

## Local smoke test against an ephemeral PG

`migrate fetch-prisma` populates `state/prisma_ddl/<sha>.sql` from the
DEMOS repo. Stub `jsonb_matches_schema -> TRUE` if `pg_jsonschema` is not
locally available.

```sh
make init                      # 00_init/
uv run migrate fetch-prisma    # GH Contents API + raw.githubusercontent.com
make ddl                       # apply Prisma + capture/drop FKs + supplements
psql "$PG_URL" -c '\dt demos_app.*'  # primary tables come from Prisma; *_history from supplements
```
