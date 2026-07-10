# Revalidate a JSONB column

`migration.revalidate_jsonb(...)` is a one-shot helper that counts how
many existing rows in a JSONB column fail a schema registered in
`migration.jsonb_schemas`. It backs two uses:

- the **budget-neutrality parity oracle** on the migration-private
  `migration.bn_workbook_detail` table -- the only column this
  migration guards with a `CONSTRAINT TRIGGER`
  (`migration.tg_validate_jsonb_against_registered_schema`); and
- ad-hoc **QA of DEMOS-owned live `demos_app.*` columns**, which carry
  no migration trigger (DEMOS owns and validates them at runtime) but
  can still be checked against the registered reference schemas.

There is **no** validation trigger on any live `demos_app.*` column, so
nothing fires automatically. Run this runbook by hand whenever a
`migration.jsonb_schemas` row is added or altered after data already
exists: schema promotion, SME-driven revision, hotfix to a draft
schema, and the post-P5 sanity sweep on cutover day.

## Pre-conditions

- `migration` and `demos_app` schemas exist.
- The schema you are validating against is already in
  `migration.jsonb_schemas` (`pg_jsonschema` installed; the row is
  loaded by `migrate seeds` from
  `reports/jsonb_schemas/<name>.schema.json`).

## Columns under validation

| Table | Column | Registered schema | Status |
| --- | --- | --- | --- |
| `migration.bn_workbook_detail` | `validation_data` | `budget_neutrality` | Wired (parity oracle) |
| `demos_app.budget_neutrality_workbook` | `validation_data` | `budget_neutrality` | DEMOS-owned; manual check only |
| `demos_app.uipath_result` | `response` | `uipath_response` | DEMOS-owned; manual check only |
| `demos_app.uipath_value` | `token_list` | `uipath_token_list` | DEMOS-owned; manual check only |

## Procedure

1. **Count offending rows** via the helper:

   ```sql
   SELECT migration.revalidate_jsonb(
     'migration.bn_workbook_detail'::regclass,
     'validation_data',
     'budget_neutrality'
   );
   ```

   Returns a `bigint`. `0` means every existing row passes the current
   registered schema.

2. **If the count is non-zero**, list the offenders so the SME can
   triage:

   ```sql
   SELECT id, validation_data
     FROM migration.bn_workbook_detail
    WHERE validation_data IS NOT NULL
      AND NOT jsonb_matches_schema(
        (SELECT schema FROM migration.jsonb_schemas WHERE name = 'budget_neutrality'),
        validation_data
      );
   ```

   Substitute `<table>`, `<col>`, `<schema_name>` for the other rows in
   the table above.

3. **Decide** with the SME:
   - Fix the data (transform upstream and rebuild — never patch
     production data by hand during cutover).
   - Relax the schema (revise the JSON Schema, re-load into
     `migration.jsonb_schemas`, re-run step 1).

4. **Re-run the helper** until it returns `0` for every column you
   touched.

## When to skip

- Before `migrate ddl`: the `migration.bn_workbook_detail` table and
  its trigger do not exist yet. Run this only after `migrate ddl` and
  the relevant data load.
- During a `pg_restore`: disable the BN trigger explicitly
  (`ALTER TABLE migration.bn_workbook_detail DISABLE TRIGGER
  bn_workbook_detail_validation_data_schema`) for the restore window,
  then re-enable and run this runbook to confirm no drift.

## Related

- `docs/developer/reference-jsonb-schema-registry.adoc`
- `docs/developer/howto-promote-jsonb-schema.adoc`
- `sql/01_ddl_supplements/00_jsonb_schema_registry.sql` (registry, trigger function, `revalidate_jsonb` helper)
- `sql/01_ddl_supplements/10_bn_workbook_detail.sql` (the BN parity oracle and its trigger)
