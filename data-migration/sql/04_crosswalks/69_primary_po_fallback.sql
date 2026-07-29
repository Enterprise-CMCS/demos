/*
 * Purpose:    Define (DDL) the operator-configurable fallback primary Project Officer -- the legacy user assigned as primary PO to any demonstration that would otherwise load without one.
 * Inputs:     none (DDL only); rows loaded from reports/inputs/primary_po_fallback.csv by the crosswalks phase.
 * Outputs:    mysql_raw.crosswalk_primary_po_fallback
 * Invariants: idempotent (DROP TABLE IF EXISTS + CREATE); singleton config keyed by scope ('default' is the global fallback); the CSV is the single source (never edit the table directly); consumed by sql/23_app_derived/41_primary_po_fallback.sql.
 * Refs:       reports/inputs/primary_po_fallback.csv, sql/23_app_derived/41_primary_po_fallback.sql, sql/99_parity/57_primary_officer_missing.sql
 *
 * DEMOS enforces (check_demonstration_primary_project_officer,
 * server/src/sql/functions.sql) that every demonstration has a
 * primary_demonstration_role_assignment whose role_id = 'Project Officer'.
 * PMDA has no such guarantee: a demonstration whose proj_ofcr_user_id is
 * NULL/0, or whose PO holder was dropped upstream (unresolved person_type /
 * person_state / unloaded demo), loads without a primary PO and is
 * semantically invalid for DEMOS.
 *
 * Per the SME decision, every such gap is backfilled with a configurable
 * fallback Project Officer. This table holds that configuration so an operator
 * can change the fallback without touching SQL: edit
 * reports/inputs/primary_po_fallback.csv and re-run the crosswalks phase. The
 * default (scope 'default') is legacy user 828, a CMS user authorized for all
 * states so the assignment satisfies the demonstration_role_assignment
 * composite FKs on any demonstration's state.
 *
 * scope is the config key. Only scope 'default' is read today (a single global
 * fallback); the column leaves room for a future per-state/per-region override
 * without a schema change.
 *
 * No source: block in registry.yaml -- this is an operator config, not a legacy
 * reference-code domain, so the live crosswalk audit treats it as un-audited.
 */
DROP TABLE IF EXISTS mysql_raw.crosswalk_primary_po_fallback;

CREATE TABLE mysql_raw.crosswalk_primary_po_fallback(
  scope text PRIMARY KEY,
  legacy_user_id integer NOT NULL,
  notes text
);

-- Values loaded from reports/inputs/primary_po_fallback.csv by the crosswalks phase.
