# Revalidate a JSONB column

`migration.revalidate_jsonb(...)` is a one-shot helper that counts how
many existing rows in a JSONB column fail a schema registered in
`migration.jsonb_schemas`. Today it backs one use:

- ad-hoc **QA of DEMOS-owned live `demos_app.*` columns**, which carry
  no migration trigger (DEMOS owns and validates them at runtime) but
  can still be checked against the registered reference schemas.

There is **no** validation trigger on any table -- not on any live
`demos_app.*` column, and not on any `migration` table. (The former
budget-neutrality parity oracle on `migration.bn_workbook_detail` used a
`CONSTRAINT TRIGGER`, but it was retired: budget-neutrality is out of
scope and DEMOS-owned.) Nothing fires automatically. Run this runbook by
hand whenever a `migration.jsonb_schemas` row is added or altered after
data already exists: schema promotion, SME-driven revision, hotfix to a
draft schema, and the post-P5 sanity sweep on cutover day.

## Pre-conditions

- `migration` and `demos_app` schemas exist.
- The schema you are validating against is already in
  `migration.jsonb_schemas` (`pg_jsonschema` installed; the row is
  loaded by `migrate seeds` from
  `reports/jsonb_schemas/<name>.schema.json`).

## Columns under validation

All live columns are DEMOS-owned; this is a reference cross-check only.

| Table | Column | Registered schema | Status |
| --- | --- | --- | --- |
| `demos_app.uipath_result` | `response` | `uipath_response` | DEMOS-owned; manual check only |
| `demos_app.uipath_value` | `token_list` | `uipath_token_list` | DEMOS-owned; manual check only |

(`application_validation` is registered as a reference schema only -- the
Prisma contract has no matching live column, so there is nothing to
sweep.)

## Procedure

1. **Count offending rows** via the helper:

   ```sql
   SELECT migration.revalidate_jsonb(
     'demos_app.uipath_result'::regclass,
     'response',
     'uipath_response'
   );
   ```

   Returns a `bigint`. `0` means every existing row passes the current
   registered schema.

2. **If the count is non-zero**, list the offenders so the SME can
   triage:

   ```sql
   SELECT id, response
     FROM demos_app.uipath_result
    WHERE response IS NOT NULL
      AND NOT jsonb_matches_schema(
        (SELECT schema FROM migration.jsonb_schemas WHERE name = 'uipath_response'),
        response
      );
   ```

   Substitute `<table>`, `<col>`, `<schema_name>` for the other row in
   the table above.

3. **Decide** with the SME:
   - Fix the data (transform upstream and rebuild — never patch
     production data by hand during cutover).
   - Relax the schema (revise the JSON Schema, re-load into
     `migration.jsonb_schemas`, re-run step 1).

4. **Re-run the helper** until it returns `0` for every column you
   touched.

## When to skip

- These are DEMOS-owned live columns. Run this only after `migrate ddl`
  and the relevant data load, and only as a reference cross-check --
  DEMOS is the authority for whether these columns are valid.

## Related

- `docs/developer/reference-jsonb-schema-registry.adoc`
- `docs/developer/howto-promote-jsonb-schema.adoc`
- `sql/01_ddl_supplements/00_jsonb_schema_registry.sql` (registry, trigger function, `revalidate_jsonb` helper)
