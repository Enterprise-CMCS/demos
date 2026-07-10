/*
 * Purpose:    Load demos_app.deliverable from stg.deliverable_resolved, resolving deliverable_type via the single-input report-occurrence crosswalk.
 * Inputs:     stg.deliverable_resolved; mysql_raw.crosswalk_deliverable_status; mysql_raw.crosswalk_deliverable_type (single-input rpt_ocrnc code -> deliverable_type map); demos_app.demonstration (Approved parent JOIN).
 * Outputs:    demos_app.deliverable
 * Invariants: runs inside the deferred-constraint build_app txn; FKs dropped during build, re-validated in the constraints phase; RETURNs before the INSERT if mysql_raw.crosswalk_deliverable_type is absent (defensive guard for a partial crosswalk build) so the unbuilt table is never name-resolved; the composite FK forces a deliverable to attach only to a loaded Approved demonstration; NULL status (code 0 N/A, null_ok) held back by the cw.status_id IS NOT NULL guard; cms_owner person_type limited to {demos-admin, demos-cms-user}; held-back rows logged for SME review (non-gating + gating parity checks); idempotent via NOT EXISTS + ON CONFLICT (id) DO NOTHING.
 * Refs:       reports/crosswalks/deliverable_type.csv, sql/04_crosswalks/52_deliverable_type.sql, reports/crosswalks/proposed/deliverable_type_bn_routing.md (correction banner), sql/04_crosswalks/50_deliverable_status.sql, sql/99_parity/40_deliverable_held.sql
 *
 * App load: demos_app.deliverable from the PMDA deliverables resolved in
 * stg.deliverable_resolved (10_stg/28_*).
 *
 * deliverable_type_id (NOT NULL) resolves via the single-input crosswalk
 * mysql_raw.crosswalk_deliverable_type (sql/04_crosswalks/52_*): the legacy
 * mdcd_dlvrbl.mdcd_dlvrbl_type_cd carries the rich report-occurrence code
 * (mdcd_dlvrbl_rpt_ocrnc_rfrnc; e.g. 57 -> Quarterly BN, 70 -> Annual BN), which
 * maps directly to demos_text_id -- no BN matrix or second signal (see the
 * correction banner in reports/crosswalks/proposed/deliverable_type_bn_routing.md).
 * The RETURN guard below is retained defensively: if the crosswalk table is
 * absent (a partial crosswalk build) the loader holds everything back rather
 * than erroring, and -- by PL/pgSQL's lazy planning of embedded SQL -- never
 * name-resolves the absent table.
 *
 * Column derivations:
 *   deliverable_type_id       crosswalk_deliverable_type(mdcd_dlvrbl_type_cd)
 *                             -- single-input report-occurrence code map
 *   demonstration_status_id   constant 'Approved'. approved_application_status_limit
 *                             seeds only 'Approved', and the composite FK
 *                             (demonstration_id, demonstration_status_id) ->
 *                             demonstration(id, status_id) forces a deliverable
 *                             to attach only to an Approved demonstration. The
 *                             inner join to a loaded Approved demo enforces this
 *                             and holds back deliverables of non-Approved or
 *                             held-back parents.
 *   status_id / due_date_type_id / expected_to_be_submitted
 *                             crosswalk_deliverable_status tuple
 *                             (04_crosswalks/50_*); code 0 (N/A) carries a NULL
 *                             status_id flagged null_ok and is held back by the
 *                             NOT NULL status_id guard below (logged for SME).
 *   cms_owner_user_id         resolved creator UUID (stg view); held back when
 *                             the creator did not migrate.
 *   cms_owner_person_type_id  resolved owner person_type; the composite FK to
 *                             users(id, person_type_id) + the
 *                             cms_user_person_type_limit FK constrain it to
 *                             {demos-admin, demos-cms-user}, so a state-user
 *                             creator is held back (anomaly, surfaced in
 *                             migration._parity_deliverable_held).
 *   name                      btrim (stg); empty names held back.
 *   due_date                  resolved due date (stg); unresolvable -> held back.
 *
 * Held-back rows are logged for SME review by the parity views
 * (sql/99_parity/40_deliverable_held.sql, non-gating check 17;
 * 41_deliverable_completeness.sql, gating check 15;
 * 42_deliverable_integrity.sql, gating check 16).
 *
 * Idempotent: NOT EXISTS + ON CONFLICT (id) DO NOTHING keep re-apply a no-op.
 */
SET search_path TO demos_app, stg, migration, mysql_raw, public;

DO $$
DECLARE
  held int;
BEGIN
  IF to_regclass('stg.deliverable_resolved') IS NULL THEN
    RAISE NOTICE 'skip deliverable load: stg.deliverable_resolved not built yet';
    RETURN;
  END IF;
  -- Defensive guard: deliverable_type_id (NOT NULL) resolves via the
  -- crosswalk. If the table is absent (a partial crosswalk build), hold back
  -- every deliverable rather than error. RETURNing here means the INSERT below
  -- is never planned, so its reference to the absent crosswalk_deliverable_type
  -- cannot error in the live pipeline.
  IF to_regclass('mysql_raw.crosswalk_deliverable_type') IS NULL THEN
    SELECT
      count(*)
    INTO
      held
    FROM
      stg.deliverable_resolved;
    RAISE NOTICE 'deliverable load: crosswalk_deliverable_type absent (partial crosswalk build); all % deliverable(s) held back (0 loaded); see migration._parity_deliverable_held', held;
    RETURN;
  END IF;
  INSERT INTO demos_app.deliverable(id, deliverable_type_id, name, demonstration_id, demonstration_status_id, status_id, cms_owner_user_id, cms_owner_person_type_id, due_date, due_date_type_id, expected_to_be_submitted, created_at, updated_at)
  SELECT
    r.new_uuid,
    xtype.demos_text_id,
    r.name,
    r.demonstration_id,
    'Approved',
    cw.status_id,
    r.cms_owner_user_id,
    r.cms_owner_person_type_id,
    r.due_date,
    cw.due_date_type_id,
    cw.expected_to_be_submitted,
    r.created_at,
    r.updated_at
  FROM
    stg.deliverable_resolved r
    JOIN demos_app.demonstration dm ON dm.id = r.demonstration_id
      AND dm.status_id = 'Approved'
    JOIN mysql_raw.crosswalk_deliverable_status cw ON cw.legacy_int_cd = r.status_cd
    JOIN mysql_raw.crosswalk_deliverable_type xtype ON xtype.legacy_int_cd = r.deliverable_type_cd
  WHERE
    r.name <> ''
    AND r.due_date IS NOT NULL
    AND cw.status_id IS NOT NULL
    AND r.cms_owner_user_id IS NOT NULL
    AND r.cms_owner_person_type_id IN ('demos-admin', 'demos-cms-user')
    AND NOT EXISTS (
      SELECT
        1
      FROM
        demos_app.deliverable ex
      WHERE
        ex.id = r.new_uuid)
  ON CONFLICT (id)
    DO NOTHING;
END
$$;

