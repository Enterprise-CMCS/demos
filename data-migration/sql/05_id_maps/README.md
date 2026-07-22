# 05_id_maps/

`migration._id_map_<source_table>` tables: legacy MySQL `int` PK ->
DEMOS `uuid` PK. One file per source data table. Maps that draw
straight from `mysql_raw` are both created and populated here. The two
demonstration maps are an exception: they are *created* here but
*populated* in `sql/10_stg/18,19_populate_id_map_*.sql`, because their
population must read the PMDA-valid filter views (`stg._valid_*`, defined
in `10_stg/`) and the build applies `05_id_maps/` before `10_stg/`. See
`docs/developer/reference-id-maps.adoc` for the canonical pattern.

## Demonstration-ID invariant (must not be violated)

Every `app.demonstration.id` in DEMOS PG originates from a PMDA row
via the id maps. New demonstration IDs are created post-migration
by the DEMOS backend and are *out of scope* for this migration.

In concrete terms:

- `migration._id_map_mdcd_demo` is populated only from
  `stg._valid_demo_ids` (filtered `mysql_raw.mdcd_demo`).
- `migration._id_map_mdcd_pendg_demo` is populated only from
  `stg._valid_pendg_demo_ids` (filtered `mysql_raw.mdcd_pendg_demo`).
- No transform may insert into either map from any other source.
- No transform may insert into `app.demonstration` with an `id` that
  is not drawn from one of those two maps.
- Pending demos that fold into an approved counterpart **reuse the
  approved UUID** (per `reports/narrative/pending_approved_decisions.md`).
  Only "orphan pending" rows (pending with no approved counterpart)
  take a UUID from `_id_map_mdcd_pendg_demo`.

The invariant is enforced at Gate 6 by
`sql/99_parity/10_demonstration_id_provenance.sql` and the
`demonstration_id_provenance` `CheckResult` in
`migration/phases/parity.py`. Any non-empty result is RED.

## PMDA project-number format

PMDA-issued demonstration project numbers conform to:

```
^11-W-[0-9]{5}/(10|[1-9])$
```

That is, `11-W-NNNNN/R` where `N` is a single digit (5 digits total)
and `R` is the CMS Region number 1-10. The row-level filter
(`sql/10_stg/10_filter_demo.sql`, `11_filter_pendg_demo.sql`,
`12_filter_aplctn.sql`) enforces the regex:

- Values matching the regex are kept.
- Values containing the substring `test` (case-insensitive) are
  auto-dropped silently.
- Everything else that fails the regex (including `NULL` where the
  field is required) is excluded **and flagged for SME review** in
  `reports/runs/filter_<stamp>.md`.

See `docs/operator/howto-curate-filter.adoc` for the SME tuning loop.
