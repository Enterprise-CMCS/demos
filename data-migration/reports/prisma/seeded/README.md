# Seeded DEMOS document-legality snapshot

Point-in-time snapshot of the three Prisma-seeded tables that govern which
`document_type` values are legal in DEMOS, captured so document crosswalk
mappings can be checked against composite-FK legality offline (no live
`demos_app` required). This is work item 1 of
`docs/developer/explanation-document-migration.adoc`.

## Source of truth

These rows are transcribed verbatim from the DEMOS baseline migration:

    server/src/model/migrations/20260312131759_init_baseline/migration.sql

(the `INSERT INTO demos_app.document_type`,
`demos_app.deliverable_type_document_type`, and
`demos_app.phase_document_type` blocks). The pinned Prisma DDL that these seeds
target is recorded under `state/prisma_ddl/` and `reports/prisma/`.

## Files

- `document_type.csv` -- the full `document_type` id domain.
- `deliverable_type_document_type.csv` -- legal `(deliverable_type_id,
  document_type_id)` pairs (the composite FK behind deliverable-linked
  documents).
- `phase_document_type.csv` -- legal `(phase_id, document_type_id)` pairs (the
  composite FK behind application-phase documents).

## Refresh

When the DEMOS baseline seed changes, re-copy the three INSERT blocks from the
migration above. `tests/test_seeded_domains.py` validates that the document
crosswalk targets remain legal against this snapshot; the SQL `*_check.sql`
gates independently validate against the live `demos_app` seed at pipeline time.
