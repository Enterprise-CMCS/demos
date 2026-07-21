# History strategy

The migration does **not** populate the DEMOS `*_history` tables. DEMOS owns
both the history tables and the rows in them; this repo leaves every
`demos_app.*_history` table empty at cutover.

## Ownership (read first)

The `demos_app.*_history` tables, the `revision_type_enum`, and the
`log_changes_*` capture triggers are **owned by DEMOS** (Prisma baseline
migration + `server/src/sql/history_triggers.sql`). This repo does **not**
author them and does **not** insert rows into them.

The history tables ship empty in the pinned Prisma artifact (created by
`migrate ddl`). After cutover, DEMOS installs the `log_changes_*` capture
triggers via `refreshDbObjects.ts`; from then on every insert/update/delete on
a parent row writes its own `revision_type` (`I`/`U`/`D`) revision. No initial
snapshot is seeded by the migration: the first capture-trigger revision is the
table's first row.

## Why we do not backfill

Per the SMEs, the DEMOS history tables do not have to be populated at cutover;
DEMOS triggers history-row creation on its own once the capture triggers are
live. Backfilling would only duplicate work the application performs anyway,
and any rows seeded before the triggers were installed would not match the
trigger's own first-write semantics. Leaving the tables empty is the
source-of-truth-aligned outcome.

This supersedes every earlier "BACKFILL / SNAPSHOT / EMPTY per table" rule: all
`demos_app.*_history` tables are now left EMPTY for DEMOS to populate.

## What changed

The former P4 `history` phase, the `sql/22_app_history/` backfill transforms,
and the `history` cutover gate were removed. The cutover sequence collapses to
`build_app -> constraints` (no `history` step in between).
